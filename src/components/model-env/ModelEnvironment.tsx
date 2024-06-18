// src/ModelEnvironment.tsx
import React, { useState, useEffect, useRef } from 'react';
import { IfcViewerAPI } from 'web-ifc-viewer';
import { Color } from 'three';
import { Stack, Button } from '@mui/material';
import { IfcContainer } from '../ifc-container/IfcContainer';
import "./ModelEnvironment.css";


interface IfcRecord {
    [key: string]: any;
}

interface ModelEnvironmentProps {
    file: File | null;
    fileInputRef: React.RefObject<HTMLInputElement>;
}

export default function ModelEnvironment({ file, fileInputRef }: any) {
    const [loading, setLoading] = useState<boolean>(false);
    const [modelLoadingStatus, setModelLoadingStatus] = useState<boolean>(false);
    const ifcContainerRef = useRef<HTMLDivElement | null>(null);
    const [ifcViewer, setIfcViewer] = useState<IfcViewerAPI | null>(null);
    const [ifcLoadingErrorMessage, setIfcLoadingErrorMessage] = useState<string | null>(null);
    const [modelID, setModelID] = useState<number | null>(null);
    const [model, setModel] = useState<any>(null);
    const [elements, setElements] = useState<any[]>([]);

    useEffect(() => {
        if (ifcContainerRef.current) {


            const container = ifcContainerRef.current;
            console.log('container', container);
            const viewer = new IfcViewerAPI({
                container,
                backgroundColor: new Color(0xffffff),
            });
            console.log('ifcViewer', viewer);
            // viewer.axes.setAxes();
            viewer.grid.setGrid();
            viewer.IFC.loader.ifcManager.applyWebIfcConfig({
                COORDINATE_TO_ORIGIN: true,
                USE_FAST_BOOLS: false,
            });
            setIfcViewer(viewer);
            console.log('set ifcViewer');
        }
    }, []);

    useEffect(() => {
        console.log('file', file);
        if (file) {
            ifcOnLoad(file);
        }
    }, [file]);

    useEffect(() => {
        const fetchElements = async () => {
            if (modelID !== null) {
                const allElements = await getAllElements(modelID);
                console.log('Elements', allElements);
                setElements(allElements);
            }
        };
        fetchElements();
    }, [modelID]);



    const ifcOnLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && ifcViewer) {
            setIfcLoadingErrorMessage('');
            setLoading(true);
            console.log('loading file');
            // Measure start time
            const startTime = performance.now();
            try {
                if (modelID !== null) {
                    deleteModel();
                }
                const model = await ifcViewer.IFC.loadIfc(file, true);
                setModel(model);
                console.log('build model');
                await ifcViewer.shadowDropper.renderShadow(model.modelID);
                console.log('render shadow');
                setModelID(model.modelID);
                setModelLoadingStatus(true);
            } catch (error) {
                ifcOnLoadError(error);
            } finally {
                setLoading(false);
            }

            // Measure end time
            const endTime = performance.now();

            console.log('done');
            console.log('Loading time:', endTime - startTime, 'milliseconds');
            console.log('done');
            console.log(ifcViewer);
        }
    };


    const ifcOnLoadError = (err: any) => {
        console.error('IFC Loading Error:', err);
        setIfcLoadingErrorMessage(`Error loading IFC: ${err.message || err}`);
    };
    const getAllElements = async (modelID: any): Promise<IfcRecord[]> => {
        const ifcManager = ifcViewer?.IFC.loader.ifcManager;
        const allItems: IfcRecord[] = [];
        if (ifcManager) {
            const tree = await ifcManager.getSpatialStructure(modelID, true);
            const queue = [tree];
            while (queue.length > 0) {
                const node = queue.shift();
                if (node) {
                    if (node.children && node.children.length > 0) {
                        queue.push(...node.children);
                    }
                    const properties = await ifcManager.getItemProperties(modelID, node.expressID, true);
                    if (properties) {
                        const elementProps = await getAllProperties(modelID, node.expressID);
                        allItems.push(elementProps);
                    }
                }
            }
        }
        return allItems;
    };

    const getAllProperties = async (modelID: any, expressID: number): Promise<IfcRecord> => {
        const ifcManager = ifcViewer?.IFC.loader.ifcManager;
        const elementProps: IfcRecord = {};
        if (ifcManager) {
            const props = await ifcManager.getItemProperties(modelID, expressID, true);
            const type = ifcManager.getIfcType(modelID, expressID);

            elementProps["Entity Type"] = type;
            elementProps["GlobalId"] = props?.GlobalId?.value || 'N/A';
            elementProps["Name"] = props?.Name?.value || 'N/A';
            elementProps["ObjectType"] = props?.ObjectType?.value || 'N/A';
            elementProps["PredefinedType"] = props?.PredefinedType?.value || 'N/A';

            // Add all properties
            for (const [key, value] of Object.entries(props || {})) {
                elementProps[key] = value && typeof value === 'object' && 'value' in value ? value.value : value;
            }
        }
        return elementProps;
    };
    const disposeModel = (model: any) => {
        if (model) {
            model.traverse((child: any) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach((material: { dispose: () => any; }) => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
        }
        setModel(null);
        setModelID(null);
    };

    const deleteModel = () => {
        if (ifcViewer && modelID !== null) {
            try {
                // Remove model from the viewer context
                ifcViewer.context.items.ifcModels = ifcViewer.context.items.ifcModels.filter((m: any) => m.modelID !== modelID);
                ifcViewer.context.items.pickableIfcModels = ifcViewer.context.items.pickableIfcModels.filter((m: any) => m.modelID !== modelID);
                ifcViewer.shadowDropper.deleteShadow(modelID.toString());

                const scene = ifcViewer.context.getScene();


                if (model) {
                    disposeModel(model);
                }

                ifcViewer.IFC.loader.ifcManager.close(modelID, scene);
                // ifcViewer.IFC.loader.ifcManager.dispose();
                setModelLoadingStatus(false);
                console.log('Model deleted and memory freed');
                // setChange(!change);
            } catch (e) {
                console.error(`Removing IfcModel ${modelID} failed`, e);
            }
        }
    };

    return (
        <div>
            <Stack direction="row">
                <IfcContainer ref={ifcContainerRef} viewer={ifcViewer} />
                {loading && <div>Loading...</div>}
                {ifcLoadingErrorMessage && <div>Error: {ifcLoadingErrorMessage}</div>}
                {/* {modelLoadingStatus && <div>IFC file loaded successfully!</div>} */}
            </Stack>
            <Button variant="contained" color="secondary" onClick={deleteModel} disabled={!modelLoadingStatus}>
                Delete Model
            </Button>
        </div>
    );
}

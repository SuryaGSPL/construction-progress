import React, { forwardRef, Fragment, useEffect, useState } from "react";
import { Grid, Popover, Typography } from "@mui/material";

interface IfcRecord {
  [key: string]: any;
}

interface IfcContainerProps {
  viewer?: any;
}

export const IfcContainer = forwardRef<HTMLDivElement, IfcContainerProps>(
  function IfcContainerFunc(props, ref) {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [curIfcRecords, setIfcRecords] = useState<IfcRecord>();
    const [isCtrlPressed, setIsCtrlPressed] = useState(false);


    const viewer = props.viewer;
    const id = popoverOpen ? "simple-popover" : undefined;

    const handleClose = () => {
      setPopoverOpen(false);
    };

    const ifcOnDoubleClick = async () => {
      if (viewer) {
        const result = await viewer.IFC.selector.pickIfcItem(true, true);
        if (result) {
          const props = await viewer.IFC.getProperties(
            result.modelID,
            result.id,
            false
          );
          console.log("Properties Container", props);
          const type = viewer.IFC.loader.ifcManager.getIfcType(
            result.modelID,
            result.id
          );
          // convert props to record
          if (props) {
            const ifcRecords: IfcRecord = {};
            ifcRecords["Entity Type"] = type;
            ifcRecords["GlobalId"] = props.GlobalId && props.GlobalId?.value;
            ifcRecords["Name"] = props.Name && props.Name?.value;
            ifcRecords["ObjectType"] =
              props.ObjectType && props.ObjectType?.value;
            ifcRecords["PredefinedType"] =
              props.PredefinedType && props.PredefinedType?.value;
            setIfcRecords(ifcRecords);
          }
          setPopoverOpen(true);
        }
      }
    };

    const ifcOnRightClick = async () => {
      if (viewer) {
        viewer.clipper.deleteAllPlanes();
        viewer.clipper.createPlane();
      }
    };


    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Control') {
        setIsCtrlPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Control') {
        setIsCtrlPressed(false);
      }
    };

    const handleMouseMove = (event: React.MouseEvent) => {
      if (isCtrlPressed) {
        viewer.IFC.selector.prePickIfcItem();
      }
    };

    useEffect(() => {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }, []);

    return (
      <>
        <div
          className={"ifcContainerViewer"}
          ref={ref}
          onDoubleClick={ifcOnDoubleClick}
          onContextMenu={ifcOnRightClick}
          onMouseMove={viewer && handleMouseMove}
          style={{
            position: "relative",
            width: "80vw",
            height: "60vh",
            overflow: "hidden",
            padding: 4,
            margin: 8,
            marginBottom: 40,
            borderRadius: 8,
            boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
          }}
        />
        <Popover
          id={id}
          open={popoverOpen}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <Grid container component={"dl"} spacing={2} sx={{ p: 2 }}>
            <Grid item>
              {curIfcRecords &&
                Object.keys(curIfcRecords).map(
                  (key) =>
                    curIfcRecords[key] && (
                      <Fragment key={key}>
                        <Typography component="dt" variant="body2">
                          {key}
                        </Typography>
                        <Typography sx={{ pb: 1 }} component={"dd"}>
                          {curIfcRecords[key]}
                        </Typography>
                      </Fragment>
                    )
                )}
            </Grid>
          </Grid>
        </Popover>
      </>
    );
  }
);

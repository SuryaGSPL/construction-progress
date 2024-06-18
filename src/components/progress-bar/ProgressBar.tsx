import React, { useState, useEffect, useRef } from 'react';
import './ProgressBar.css';
import LinearProgress from '@mui/material/LinearProgress';
import { IconButton, Paper, Stack, TextField, Typography, Box } from '@mui/material';
import { PlayArrowRounded, PauseRounded, FastRewindRounded, FastForwardRounded, CheckRounded, EditRounded } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

type Label = {
    month: string;
    year: number;
    position: number;
};

type Props = {
    startDate: string;
    endDate: string;
};

function ProgressBar({ startDate, endDate }: Props) {

    const [currentDate, setCurrentDate] = useState<Date>(new Date(startDate));
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isProgressBarHover, setIsProgressBarHover] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const progressBarRef = useRef<HTMLDivElement | null>(null);
    const difference = 10 * 24 * 60 * 60 * 1000; // 10 days in milliseconds

    const totalDuration = new Date(endDate).getTime() - new Date(startDate).getTime();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDate((oldDate) => {
                if (oldDate >= new Date(endDate)) {
                    isPlaying && setIsPlaying(false);

                }
                const newDate = isPlaying ? new Date(oldDate.getTime() + 24 * 60 * 60 * 1000) : oldDate;
                return newDate > new Date(endDate) ? new Date(endDate) : newDate;
            });
        }, 500); // Adjust this for smoother progress

        return () => {
            clearInterval(timer);
        };
    }, [isPlaying, startDate, endDate]);

    const calculateProgress = (): number => {
        const elapsedTime = currentDate.getTime() - new Date(startDate).getTime();
        return (elapsedTime / totalDuration) * 100;
    };

    const playPause = () => {
        setIsPlaying(!isPlaying);
    };

    const fastForward = () => {
        setCurrentDate((oldDate) => {
            const newDate = new Date(oldDate.getTime() + difference);
            return newDate > new Date(endDate) ? new Date(endDate) : newDate;
        });
    };

    const rewind = () => {
        setCurrentDate((oldDate) => {
            const newDate = new Date(oldDate.getTime() - difference);
            return newDate < new Date(startDate) ? new Date(startDate) : newDate;
        });
    };

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        updateProgress(event);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (event: MouseEvent) => {
        updateProgress(event);
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const updateProgress = (event: MouseEvent | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const progressBar = progressBarRef.current;
        if (progressBar) {
            const rect = progressBar.getBoundingClientRect();
            const offsetX = event.clientX - rect.left;
            const newProgress = (offsetX / rect.width) * 100;
            const newDate = new Date(new Date(startDate).getTime() + (newProgress / 100) * totalDuration);
            const clampedDate = new Date(Math.max(new Date(startDate).getTime(), Math.min(newDate.getTime(), new Date(endDate).getTime())));
            setCurrentDate(clampedDate);
        }
    };

    const generateLabels = (): Label[] => {
        const labels: Label[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const progressBarWidth = progressBarRef.current ? progressBarRef.current.offsetWidth : 0;

        // Calculate total months between start and end dates
        const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1;

        // Determine the maximum number of labels that fit in the progress bar
        const maxLabels = Math.floor(progressBarWidth / 50); // Adjust 50px per label as needed

        // Determine step to reduce the number of labels if necessary
        const step = Math.ceil(totalMonths / maxLabels);

        for (let i = 0; i < totalMonths; i += step) {
            const date = new Date(start.getFullYear(), start.getMonth() + i, 1);
            const position = (((date.getTime() - start.getTime()) / totalDuration) * 100);
            labels.push({
                month: date.toLocaleString('default', { month: 'short' }),
                year: date.getFullYear(),
                position
            });
        }
        // console.log(labels);
        return labels;
    };

    const monthLabels = generateLabels();
    const theme = useTheme();
    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return (
        <Stack direction={"column"} spacing={2}>



            {/* Info Panel */}
            <div>
                <Paper className='info-panel' sx={{ color: 'primary.main', fontWeight: 'bold' }} elevation={4}

                >
                    {
                        isEditing ? (
                            <Stack direction={"row"} spacing={2} sx={{ alignItems: 'center', cursor: 'pointer' }}>
                                <TextField
                                    type='date'
                                    value={formatDate(currentDate)}
                                    onChange={(e) => setCurrentDate(new Date(e.target.value))}
                                />
                                <CheckRounded fontSize='large' onClick={() => setIsEditing(false)} />
                            </Stack>
                        ) :
                            <Stack direction={"row"} spacing={2} sx={{ alignItems: 'center' }}>
                                <Typography className='info' sx={{ userSelect: 'none' }}>{currentDate.toDateString()}</Typography>
                                <EditRounded fontSize='medium' sx={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setIsEditing(true)
                                        setIsPlaying(false)
                                    }} />
                            </Stack>
                    }
                </Paper>
            </div>

            {/* Progress Bar and Controls */}
            <Paper sx={{ width: '100%', p: 4, position: 'relative' }} elevation={4}>
                <div
                    ref={progressBarRef}
                    onMouseDown={handleMouseDown}
                    onMouseEnter={() => setIsProgressBarHover(true)}
                    onMouseLeave={() => setIsProgressBarHover(false)}
                    style={{ position: 'relative' }}
                    className='progress-bar-container'
                >
                    <LinearProgress
                        className='progress-bar'
                        variant="determinate"
                        value={calculateProgress()}
                    />

                    <div style={{
                        backgroundColor: theme.palette.primary.main,
                        display: isProgressBarHover ? 'inline-block' : 'none',
                        position: 'absolute',
                        left: `${calculateProgress()}%`,
                        transition: '0.4s',
                        transform: 'translateX(-50%) translateY(-73%)',
                        cursor: 'pointer',
                        borderRadius: '50%',
                        width: isProgressBarHover ? '18px' : '0px',
                        height: isProgressBarHover ? '18px' : '0px',

                    }} />

                    {/* Month Labels */}

                    <Box className='month-labels' sx={{ position: 'relative', width: '100%', marginTop: '20px', marginBottom: '40px' }}>
                        {monthLabels.map((label, index) => (
                            (label.position >= 0 && label.position <= 95) &&
                            <Box
                                key={index}
                                sx={{
                                    position: 'absolute',
                                    left: `${label.position}%`,
                                    transform: 'translateX(-50%)',
                                    textAlign: 'center',
                                    fontSize: '0.75rem',

                                }}
                            >
                                <Typography sx={{ userSelect: 'none' }}>{label.month}</Typography>
                                <Typography sx={{ userSelect: 'none' }} variant="caption">{label.year}</Typography>
                            </Box>
                        ))}
                    </Box>
                </div>

                <Stack className='control-panel' direction={"row"} spacing={2}>
                    <IconButton className='control' onClick={rewind}><FastRewindRounded /></IconButton>
                    <IconButton className='control' onClick={playPause}>{isPlaying ? <PauseRounded /> : <PlayArrowRounded />}</IconButton>
                    <IconButton className='control' onClick={fastForward}><FastForwardRounded /></IconButton>
                </Stack>


            </Paper>
        </Stack>
    );
}

export default ProgressBar;

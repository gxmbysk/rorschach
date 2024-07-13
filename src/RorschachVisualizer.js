import React, { useRef, useEffect, useState, useCallback } from 'react';

const RorschachVisualizer = () => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationFrameId = useRef(null);

  const createInkblotShape = useCallback((ctx, width, height, time) => {
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.beginPath();
    ctx.moveTo(centerX, 0);

    const t = time / 1000; // Normalize time

    // Create a more complex, asymmetrical shape with dynamic changes
    ctx.bezierCurveTo(centerX + 100 * Math.sin(t), centerY - 100 * Math.cos(t), centerX - 150 * Math.cos(t), centerY + 100 * Math.sin(t), centerX, height);
    ctx.bezierCurveTo(centerX + 80 * Math.cos(t), centerY + 80 * Math.sin(t), centerX + 150 * Math.sin(t), centerY - 50 * Math.cos(t), centerX + 50 * Math.cos(t), centerY - 150 * Math.sin(t));
    ctx.bezierCurveTo(centerX + 20 * Math.sin(t), centerY - 180 * Math.cos(t), centerX - 60 * Math.cos(t), centerY - 120 * Math.sin(t), centerX, 0);

    // Mirror the shape
    ctx.moveTo(centerX, 0);
    ctx.bezierCurveTo(centerX - 100 * Math.sin(t), centerY - 100 * Math.cos(t), centerX + 150 * Math.cos(t), centerY + 100 * Math.sin(t), centerX, height);
    ctx.bezierCurveTo(centerX - 80 * Math.cos(t), centerY + 80 * Math.sin(t), centerX - 150 * Math.sin(t), centerY - 50 * Math.cos(t), centerX - 50 * Math.cos(t), centerY - 150 * Math.sin(t));
    ctx.bezierCurveTo(centerX - 20 * Math.sin(t), centerY - 180 * Math.cos(t), centerX + 60 * Math.cos(t), centerY - 120 * Math.sin(t), centerX, 0);
  }, []);

  const drawInkblot = useCallback((ctx, audioData, time) => {
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create gradient that changes over time
    const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 10, canvas.width / 2, canvas.height / 2, canvas.width / 2);
    gradient.addColorStop(0, `rgba(${(time % 255)}, 0, 0, 0.8)`);
    gradient.addColorStop(1, `rgba(0, 0, ${255 - (time % 255)}, 0.2)`);

    ctx.fillStyle = gradient;

    // Draw the base inkblot shape
    createInkblotShape(ctx, canvas.width, canvas.height, time);

    // Use audio data to slightly distort the shape
    ctx.save();
    const avgAudioData = audioData.reduce((a, b) => a + b, 0) / audioData.length;
    const scale = 1 + (avgAudioData / 255) * 0.1; // Scale between 1 and 1.1
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    ctx.fill();
    ctx.restore();
  }, [createInkblotShape]);

  const renderFrame = useCallback((time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const audioData = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(audioData);

    drawInkblot(ctx, audioData, time);

    animationFrameId.current = requestAnimationFrame(renderFrame);
  }, [drawInkblot]);

  const startVisualizer = useCallback(async () => {
    if (!isPlaying) {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioContext.createMediaElementSource(new Audio('path/to/your/audio/file.mp3'));
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      source.mediaElement.play();
      setIsPlaying(true);

      animationFrameId.current = requestAnimationFrame(renderFrame);
    }
  }, [isPlaying, renderFrame]);

  const stopVisualizer = useCallback(() => {
    if (isPlaying) {
      cancelAnimationFrame(animationFrameId.current);
      setIsPlaying(false);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => stopVisualizer();
  }, [stopVisualizer]);

  return (
    <div>
      <canvas ref={canvasRef} />
      <button onClick={startVisualizer}>Start</button>
      <button onClick={stopVisualizer}>Stop</button>
    </div>
  );
};

export default RorschachVisualizer;

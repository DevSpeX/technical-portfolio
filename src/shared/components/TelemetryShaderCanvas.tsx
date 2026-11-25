'use client';

import { useEffect, useRef, useState } from 'react';
import { InspectableModule, useInspector } from '@/features/inspector';
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion';
import { cn } from '@/shared/lib/cn';

export interface TelemetryShaderCanvasProps {
  readonly className?: string;
}

const STATIC_FRAME_TIME = 14.2;
const MAX_DPR = 2;

const VERTEX_SHADER_SOURCE = `#version 300 es
out vec2 v_uv;

void main() {
  // Full-screen triangle via gl_VertexID (zero vertex buffer allocation)
  vec2 pos = vec2(float((gl_VertexID & 1) << 2), float((gl_VertexID & 2) << 1)) - 1.0;
  v_uv = pos * 0.5 + 0.5;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_mouseActive;
uniform float u_inspector;

// Obsidian & Precision Slate design tokens
const vec3 COLOR_CANVAS  = vec3(0.02745, 0.03137, 0.03922); // #07080a
const vec3 COLOR_SURFACE = vec3(0.04314, 0.05098, 0.06667); // #0b0d11
const vec3 COLOR_SLATE   = vec3(0.11765, 0.14118, 0.18824); // #1e2430
const vec3 COLOR_COBALT  = vec3(0.37647, 0.64706, 0.98039); // #60a5fa
const vec3 COLOR_EMERALD = vec3(0.20392, 0.82745, 0.60000); // #34d399

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.52;
  mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);

  for (int i = 0; i < 4; i++) {
    value += amplitude * valueNoise(p);
    p = rot * p * 2.03 + vec2(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  // Smooth mouse field vector in aspect-corrected space
  vec2 mousePos = (u_mouse - 0.5) * vec2(aspect, 1.0);
  float mouseDist = length(p - mousePos);
  float mouseInfluence = exp(-mouseDist * mouseDist * 5.2) * u_mouseActive;

  // Slow organic drift for topographic telemetry elevation
  float t = u_time * 0.085;
  vec2 warp = vec2(
    fbm(p * 1.45 + vec2(t, -t * 0.6)),
    fbm(p * 1.45 + vec2(-t * 0.5, t * 0.8) + vec2(4.2, 1.9))
  );

  // Organic elevation field + subtle standing wave interference
  float field = fbm(p * 2.15 + warp * 0.65 - vec2(0.0, t * 0.35));
  float wave = sin(p.x * 5.5 + p.y * 3.2 - u_time * 0.25 + field * 4.0) * 0.065;
  float elevation = field + wave + mouseInfluence * 0.22;

  // Anti-aliased topographic isolines via screen-space derivatives
  float levels = mix(11.0, 15.0, u_inspector);
  float contourCoord = elevation * levels;
  float contourDist = abs(fract(contourCoord - 0.5) - 0.5);
  float contourWidth = max(fwidth(contourCoord), 0.001);
  float contourLine = 1.0 - smoothstep(0.0, contourWidth * 1.35, contourDist);

  // Secondary major elevation contour every 3rd level
  float majorCoord = elevation * (levels / 3.0);
  float majorDist = abs(fract(majorCoord - 0.5) - 0.5);
  float majorWidth = max(fwidth(majorCoord), 0.001);
  float majorLine = 1.0 - smoothstep(0.0, majorWidth * 1.65, majorDist);

  // Subtle architectural precision grid (intensifies in X-Ray Inspector Mode)
  float gridScale = 14.0;
  vec2 gridUv = p * gridScale;
  vec2 gridDist = abs(fract(gridUv - 0.5) - 0.5);
  vec2 gridFw = max(fwidth(gridUv), vec2(0.001));
  vec2 gridAxes = 1.0 - smoothstep(vec2(0.0), gridFw * 1.15, gridDist);
  float gridLine = max(gridAxes.x, gridAxes.y);

  // Precision intersection nodes visible near cursor or in X-Ray mode
  vec2 cellCenter = abs(fract(gridUv) - 0.5);
  float nodeMask = 1.0 - smoothstep(0.04, 0.09, length(cellCenter));
  float nodeGlow = nodeMask * (0.14 * u_inspector + 0.22 * mouseInfluence);

  // Base obsidian atmospheric gradient
  vec3 color = mix(COLOR_CANVAS, COLOR_SURFACE, smoothstep(0.0, 1.0, elevation));

  // Subtle top-left cobalt architectural key light
  float heroGlow = exp(-length(p - vec2(-0.28 * aspect, 0.34)) * 1.85);
  color += COLOR_COBALT * heroGlow * 0.075;

  // Blend precision grid
  float gridOpacity = mix(0.11, 0.24, u_inspector) + mouseInfluence * 0.14;
  color = mix(color, COLOR_SLATE, gridLine * gridOpacity);

  // Blend fine topographic contours
  vec3 contourTint = mix(COLOR_SLATE * 1.35, COLOR_COBALT, 0.32 + mouseInfluence * 0.45 + u_inspector * 0.22);
  color = mix(color, contourTint, contourLine * (0.24 + mouseInfluence * 0.22 + u_inspector * 0.12));

  // Highlight major elevation ridges with restrained cobalt/emerald telemetry accents
  vec3 majorTint = mix(COLOR_COBALT, COLOR_EMERALD, smoothstep(0.45, 0.85, elevation) * (0.35 + 0.45 * u_inspector));
  color += majorTint * majorLine * (0.14 + mouseInfluence * 0.22 + u_inspector * 0.14);

  // Add subtle telemetry node ticks & cursor halo
  color += mix(COLOR_COBALT, COLOR_EMERALD, u_inspector) * nodeGlow;
  color += COLOR_COBALT * mouseInfluence * 0.055;

  // Seamless edge & bottom vignette into --surface-canvas (#07080a)
  float bottomFade = smoothstep(0.0, 0.28, uv.y);
  float topFade = smoothstep(1.0, 0.86, uv.y);
  float sideFade = smoothstep(0.0, 0.14, uv.x) * smoothstep(1.0, 0.86, uv.x);
  float mask = bottomFade * mix(0.55, 1.0, topFade) * mix(0.45, 1.0, sideFade);

  color = mix(COLOR_CANVAS, color, mask);
  outColor = vec4(color, 1.0);
}
`;

interface GlResources {
  readonly gl: WebGL2RenderingContext;
  readonly program: WebGLProgram;
  readonly vao: WebGLVertexArrayObject | null;
  readonly uResolution: WebGLUniformLocation | null;
  readonly uTime: WebGLUniformLocation | null;
  readonly uMouse: WebGLUniformLocation | null;
  readonly uMouseActive: WebGLUniformLocation | null;
  readonly uInspector: WebGLUniformLocation | null;
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function initWebGL2(canvas: HTMLCanvasElement): GlResources | null {
  let gl: WebGL2RenderingContext | null = null;

  try {
    gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
    });
  } catch {
    return null;
  }

  if (!gl) {
    return null;
  }

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    FRAGMENT_SHADER_SOURCE,
  );

  if (!vertexShader || !fragmentShader) {
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  // Shaders are no longer needed once linked
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  const vao = gl.createVertexArray();

  return {
    gl,
    program,
    vao,
    uResolution: gl.getUniformLocation(program, 'u_resolution'),
    uTime: gl.getUniformLocation(program, 'u_time'),
    uMouse: gl.getUniformLocation(program, 'u_mouse'),
    uMouseActive: gl.getUniformLocation(program, 'u_mouseActive'),
    uInspector: gl.getUniformLocation(program, 'u_inspector'),
  };
}

/**
 * Zero-dependency WebGL2 GLSL ambient topographic telemetry shader.
 * Features IntersectionObserver viewport culling, `prefers-reduced-motion`
 * static-frame rendering, mouse & X-Ray reactivity, and CSS fallback on
 * WebGL context loss or unavailability.
 */
export function TelemetryShaderCanvas({
  className,
}: TelemetryShaderCanvasProps) {
  const { isActive: isInspectorActive } = useInspector();
  const prefersReducedMotion = usePrefersReducedMotion();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inspectorTargetRef = useRef<number>(isInspectorActive ? 1 : 0);
  const reducedMotionRef = useRef<boolean>(prefersReducedMotion);
  const renderSingleFrameRef = useRef<(() => void) | null>(null);

  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    inspectorTargetRef.current = isInspectorActive ? 1 : 0;
    if (reducedMotionRef.current) {
      renderSingleFrameRef.current?.();
    }
  }, [isInspectorActive]);

  useEffect(() => {
    reducedMotionRef.current = prefersReducedMotion;
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return;
    }

    let resources = initWebGL2(canvas);
    if (!resources) {
      setUseFallback(true);
      return;
    }

    let rafId: number | null = null;
    let isDisposed = false;
    let isContextLost = false;
    let isInViewport = true;
    let isTabVisible = document.visibilityState !== 'hidden';
    let lastTimestamp = performance.now();
    let elapsedSeconds = 0;

    // Smoothed interactive uniform states
    let targetMouseX = 0.35;
    let targetMouseY = 0.62;
    let smoothMouseX = 0.35;
    let smoothMouseY = 0.62;
    let targetMouseActive = 0;
    let smoothMouseActive = 0;
    let smoothInspector = inspectorTargetRef.current;

    const resizeCanvas = (): void => {
      if (!resources || isContextLost) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      resources.gl.viewport(0, 0, width, height);
    };

    const drawFrame = (timeSec: number): void => {
      if (!resources || isContextLost) {
        return;
      }

      const { gl, program, vao } = resources;
      gl.useProgram(program);
      if (vao) {
        gl.bindVertexArray(vao);
      }

      if (resources.uResolution) {
        gl.uniform2f(resources.uResolution, canvas.width, canvas.height);
      }
      if (resources.uTime) {
        gl.uniform1f(resources.uTime, timeSec);
      }
      if (resources.uMouse) {
        gl.uniform2f(resources.uMouse, smoothMouseX, smoothMouseY);
      }
      if (resources.uMouseActive) {
        gl.uniform1f(resources.uMouseActive, smoothMouseActive);
      }
      if (resources.uInspector) {
        gl.uniform1f(resources.uInspector, smoothInspector);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const stopLoop = (): void => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const tick = (now: number): void => {
      if (
        isDisposed ||
        isContextLost ||
        !isInViewport ||
        !isTabVisible ||
        reducedMotionRef.current
      ) {
        rafId = null;
        return;
      }

      const delta = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;
      elapsedSeconds += delta;

      const lerpFactor = Math.min(1, delta * 6.5);
      smoothMouseX += (targetMouseX - smoothMouseX) * lerpFactor;
      smoothMouseY += (targetMouseY - smoothMouseY) * lerpFactor;
      smoothMouseActive += (targetMouseActive - smoothMouseActive) * lerpFactor;
      smoothInspector +=
        (inspectorTargetRef.current - smoothInspector) * lerpFactor;

      drawFrame(elapsedSeconds);
      rafId = window.requestAnimationFrame(tick);
    };

    const startLoop = (): void => {
      if (isDisposed || isContextLost || !isInViewport || !isTabVisible) {
        return;
      }

      if (reducedMotionRef.current) {
        stopLoop();
        smoothInspector = inspectorTargetRef.current;
        smoothMouseActive = 0;
        drawFrame(STATIC_FRAME_TIME);
        return;
      }

      if (rafId === null) {
        lastTimestamp = performance.now();
        rafId = window.requestAnimationFrame(tick);
      }
    };

    renderSingleFrameRef.current = () => {
      if (isDisposed || isContextLost) {
        return;
      }
      smoothInspector = inspectorTargetRef.current;
      smoothMouseActive = 0;
      resizeCanvas();
      drawFrame(STATIC_FRAME_TIME);
    };

    const handlePointerMove = (event: PointerEvent): void => {
      if (reducedMotionRef.current || event.pointerType !== 'mouse') {
        return;
      }

      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }

      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!inside) {
        targetMouseActive = 0;
        return;
      }

      targetMouseX = (event.clientX - rect.left) / rect.width;
      // Flip Y to match WebGL UV coordinates (bottom-left origin)
      targetMouseY = 1 - (event.clientY - rect.top) / rect.height;
      targetMouseActive = 1;
    };

    const handlePointerLeaveWindow = (): void => {
      targetMouseActive = 0;
    };

    const handleVisibilityChange = (): void => {
      isTabVisible = document.visibilityState !== 'hidden';
      if (isTabVisible) {
        startLoop();
      } else {
        stopLoop();
      }
    };

    const handleContextLost = (event: Event): void => {
      event.preventDefault();
      isContextLost = true;
      stopLoop();
      setUseFallback(true);
    };

    const handleContextRestored = (): void => {
      if (isDisposed) {
        return;
      }
      const restored = initWebGL2(canvas);
      if (!restored) {
        setUseFallback(true);
        return;
      }
      resources = restored;
      isContextLost = false;
      setUseFallback(false);
      resizeCanvas();
      startLoop();
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      if (reducedMotionRef.current) {
        drawFrame(STATIC_FRAME_TIME);
      }
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }
        isInViewport = entry.isIntersecting;
        if (isInViewport) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0.01 },
    );
    intersectionObserver.observe(container);

    window.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });
    document.addEventListener('mouseleave', handlePointerLeaveWindow);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    resizeCanvas();
    startLoop();

    return () => {
      isDisposed = true;
      renderSingleFrameRef.current = null;
      stopLoop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeaveWindow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      if (resources && !isContextLost) {
        if (resources.vao) {
          resources.gl.deleteVertexArray(resources.vao);
        }
        resources.gl.deleteProgram(resources.program);
      }
      resources = null;
    };
  }, [prefersReducedMotion]);

  return (
    <InspectableModule
      name="TelemetryShaderCanvas"
      layer="Client // WebGL2 GLSL"
      renderMetric="60fps · Viewport-Culled"
      tone="client"
      className={cn(
        'pointer-events-none absolute inset-x-0 top-11 bottom-0 overflow-hidden',
        className,
      )}
    >
      <div ref={containerRef} aria-hidden="true" className="relative h-full w-full">
        {/* Pure CSS fallback shown if WebGL2 is unavailable or context is lost */}
        <div
          className={cn(
            'telemetry-shader-fallback absolute inset-0 transition-opacity duration-300',
            useFallback ? 'opacity-100' : 'opacity-0',
          )}
        />

        <canvas
          ref={canvasRef}
          className={cn(
            'block h-full w-full transition-opacity duration-300',
            useFallback ? 'opacity-0' : 'opacity-100',
          )}
        />
      </div>
    </InspectableModule>
  );
}

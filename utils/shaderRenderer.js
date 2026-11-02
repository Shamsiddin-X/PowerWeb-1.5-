/** Self-contained: this function is also embedded in HTML/React exports. */
export function startShader(canvas, initial, onError) {
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!gl) {
        onError?.('WebGL недоступен на этом устройстве.');
        return null;
    }
    let config = initial, frame = 0, stopped = false, time = 0, last = 0;
    let fragment = config.fragment;
    // Every click gets its own shader evaluation, including saved/custom shaders that
    // only know u_clickAge/u_clickPosition (or animate entirely through u_time).
    // Native array-aware shaders already combine their own waves and stay unchanged.
    const executable = fragment.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');
    const uniformDeclaration = /uniform\s+(?:(?:lowp|mediump|highp)\s+)?\w+\s+[^;]+;/g;
    const body = executable.replace(uniformDeclaration, '');
    const replayClicks = config.interaction === 'click' && !/\bu_clicks\b/.test(body);
    if (replayClicks) {
        const perClick = { u_clickPosition: 'vec2', u_clickAge: 'float', u_click: 'float', u_mouse: 'vec2', u_trail: 'vec2', u_hover: 'float', u_time: 'float' };
        const usesSource = /\bu_source\b/.test(body);
        const usesAmount = /\bu_amount\b/.test(body);
        fragment = fragment.replace(/uniform\s+((?:(?:lowp|mediump|highp)\s+)?(?:float|vec2))\s+([^;]+);/g, (_all, type, names) => `uniform ${type} ${names.split(',').map((name) => {
            const trimmed = name.trim();
            return perClick[trimmed] ? 'pwbBase_' + trimmed : trimmed;
        }).join(',')};`).replace(/void\s+main\s*\(\s*(?:void)?\s*\)/, 'void pwbSingleClick()');
        let declarations = Object.entries(perClick).map(([name, type]) => `${type} ${name};`).join('\n') + '\nuniform float pwbReplaySpeed;\n';
        const declared = (name) => new RegExp('uniform\\s+[^;]*\\b' + name + '\\b').test(executable);
        if (!declared('u_clicks'))
            declarations += 'uniform vec3 u_clicks[12];\n';
        if (!declared('u_clickCount'))
            declarations += 'uniform float u_clickCount;\n';
        if (usesSource && !declared('u_sourceSize'))
            declarations += 'uniform vec2 u_sourceSize;\n';
        if (usesSource && !declared('u_resolution'))
            declarations += 'uniform vec2 u_resolution;\n';
        if (usesSource && !usesAmount)
            declarations += 'uniform float pwbReplayAmount;\n';
        const capacity = Math.min(12, Math.max(1, Number(executable.match(/\bu_clicks\s*\[\s*(\d+)\s*\]/)?.[1]) || 12));
        if (/precision\s+\w+\s+float\s*;/.test(fragment)) {
            fragment = fragment.replace(/precision\s+\w+\s+float\s*;/, match => match + '\n' + declarations);
        }
        else {
            fragment = fragment.replace(/^((?:\s*#[^\n]*\n)*)/, (_match, directives) => directives + 'precision mediump float;\n' + declarations);
        }
        fragment += `\nvoid main(){
      ${usesSource ? `vec2 uv=gl_FragCoord.xy/u_resolution;
      float sourceRatio=u_sourceSize.x/max(u_sourceSize.y,1.0);
      float viewRatio=u_resolution.x/u_resolution.y;
      vec2 cover=vec2(min(1.0,viewRatio/sourceRatio),min(1.0,sourceRatio/viewRatio));
      vec4 original=texture2D(u_source,clamp((uv-0.5)*cover+0.5,0.001,0.999));
      vec4 changes=vec4(0.0);` : 'vec3 sum=vec3(0.0);float alpha=0.0;'}
      for(int i=0;i<${capacity};i++){if(float(i)<u_clickCount){
        u_clickPosition=u_clicks[i].xy;u_clickAge=u_clicks[i].z;
        u_click=max(0.0,1.0-u_clickAge/1.8);
        u_mouse=u_clickPosition;u_trail=u_clickPosition;u_hover=1.0;u_time=u_clickAge*pwbReplaySpeed;
        gl_FragColor=vec4(0.0);pwbSingleClick();
        ${usesSource ? 'changes+=(gl_FragColor-original)*u_click;' : 'float a=clamp(gl_FragColor.a,0.0,1.0)*u_click;sum+=gl_FragColor.rgb*a;alpha+=a;'}
      }}
      ${usesSource ? `gl_FragColor=clamp(original+changes*${usesAmount ? '1.0' : 'pwbReplayAmount'},0.0,1.0);` : 'gl_FragColor=vec4(sum/max(alpha,0.0001),clamp(alpha,0.0,1.0));'}
    }`;
    }
    const shaders = [];
    const program = gl.createProgram();
    let buffer = null;
    let texture = null;
    let sourceNode = null;
    let originalOpacity = '';
    const release = () => { if (sourceNode)
        sourceNode.style.opacity = originalOpacity; if (texture)
        gl.deleteTexture(texture); if (buffer)
        gl.deleteBuffer(buffer); shaders.forEach(s => gl.deleteShader(s)); if (program)
        gl.deleteProgram(program); };
    try {
        for (const [type, source] of [[gl.VERTEX_SHADER, 'attribute vec2 a_position; void main(){ gl_Position=vec4(a_position,0.0,1.0); }'], [gl.FRAGMENT_SHADER, fragment]]) {
            const shader = gl.createShader(type);
            if (!shader)
                throw new Error('Не удалось создать шейдер.');
            shaders.push(shader);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
                throw new Error(gl.getShaderInfoLog(shader) || 'Ошибка GLSL');
            gl.attachShader(program, shader);
        }
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            throw new Error(gl.getProgramInfoLog(program) || 'Ошибка связи GLSL');
        gl.useProgram(program);
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
        const position = gl.getAttribLocation(program, 'a_position');
        if (position >= 0) {
            gl.enableVertexAttribArray(position);
            gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        }
    }
    catch (e) {
        release();
        onError?.(e instanceof Error ? e.message : String(e));
        return null;
    }
    const locations = Object.fromEntries(['u_source', 'u_sourceSize', 'u_amount', 'u_resolution', 'u_surfaceSize', 'u_size', 'u_time', 'u_scale', 'u_intensity', 'u_colorA', 'u_colorB', 'u_mouse', 'u_trail', 'u_hover', 'u_click', 'u_clickAge', 'u_clickPosition', 'u_radius', 'u_strength'].map(name => [name, gl.getUniformLocation(program, name)]));
    locations.u_clicks = gl.getUniformLocation(program, 'u_clicks[0]');
    locations.u_clickCount = gl.getUniformLocation(program, 'u_clickCount');
    locations.pwbReplaySpeed = gl.getUniformLocation(program, 'pwbReplaySpeed');
    locations.pwbReplayAmount = gl.getUniformLocation(program, 'pwbReplayAmount');
    let clickCapacity = 12;
    if (locations.u_clicks !== null) {
        for (let i = 0; i < gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i++) {
            const uniform = gl.getActiveUniform(program, i);
            if (uniform?.name === 'u_clicks[0]') {
                clickCapacity = Math.min(12, uniform.size);
                break;
            }
        }
    }
    const multiClicks = locations.u_clicks !== null;
    const usesSource = locations.u_source !== null;
    const raster = document.createElement('canvas');
    const textureLimit = Math.min(4096, gl.getParameter(gl.MAX_TEXTURE_SIZE));
    let sourceKey = '', sourceWidth = 1, sourceHeight = 1, sourceReady = false, sourceFailed = false;
    if (usesSource) {
        sourceNode = canvas.parentElement?.querySelector('[data-pwb-shader-source]') || null;
        originalOpacity = sourceNode?.style.opacity || '';
        texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.uniform1i(locations.u_source, 0);
        canvas.style.visibility = 'hidden';
        document.fonts?.ready.then(() => { sourceKey = ''; });
    }
    const uploadSource = (width, height) => {
        if (!usesSource || !sourceNode || sourceFailed)
            return !usesSource;
        try {
            let source;
            let key;
            if (sourceNode instanceof HTMLVideoElement) {
                if (sourceNode.readyState < 2)
                    return false;
                source = sourceNode;
                sourceWidth = sourceNode.videoWidth;
                sourceHeight = sourceNode.videoHeight;
                key = sourceNode.currentSrc + ':' + sourceNode.currentTime;
            }
            else if (sourceNode instanceof HTMLImageElement) {
                if (!sourceNode.complete || !sourceNode.naturalWidth)
                    return false;
                source = sourceNode;
                sourceWidth = sourceNode.naturalWidth;
                sourceHeight = sourceNode.naturalHeight;
                key = sourceNode.currentSrc;
            }
            else {
                const css = getComputedStyle(sourceNode), text = sourceNode.textContent || '';
                key = [text, width, height, css.font, css.color, css.textAlign, css.lineHeight].join('|');
                if (key !== sourceKey) {
                    raster.width = width;
                    raster.height = height;
                    const ctx = raster.getContext('2d');
                    const logicalWidth = Math.max(1, sourceNode.clientWidth);
                    ctx.scale(width / logicalWidth, height / Math.max(1, sourceNode.clientHeight));
                    ctx.font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
                    ctx.fillStyle = css.color;
                    ctx.textBaseline = 'alphabetic';
                    const lineHeight = parseFloat(css.lineHeight) || parseFloat(css.fontSize) * 1.2;
                    const lines = [];
                    for (const paragraph of text.split('\n')) {
                        let line = '';
                        for (const token of paragraph.match(/\s+|\S+/gu) || ['']) {
                            if (line && ctx.measureText(line + token).width > logicalWidth) {
                                lines.push(line);
                                line = '';
                            }
                            if (ctx.measureText(token).width > logicalWidth) {
                                for (const character of Array.from(token)) {
                                    if (line && ctx.measureText(line + character).width > logicalWidth) {
                                        lines.push(line);
                                        line = '';
                                    }
                                    line += character;
                                }
                            }
                            else
                                line += token;
                        }
                        lines.push(line);
                    }
                    ctx.textAlign = css.textAlign;
                    const x = css.textAlign === 'center' ? logicalWidth / 2 : css.textAlign === 'right' ? logicalWidth : 0;
                    const metrics = ctx.measureText('Mg');
                    const ascent = metrics.fontBoundingBoxAscent || parseFloat(css.fontSize) * 0.9;
                    const descent = metrics.fontBoundingBoxDescent || parseFloat(css.fontSize) * 0.2;
                    const baseline = (lineHeight - ascent - descent) / 2 + ascent;
                    lines.forEach((line, index) => ctx.fillText(line, x, index * lineHeight + baseline));
                }
                source = raster;
                sourceWidth = width;
                sourceHeight = height;
            }
            const media = sourceNode instanceof HTMLImageElement || sourceNode instanceof HTMLVideoElement;
            if (media) {
                const fit = getComputedStyle(sourceNode).objectFit || 'fill';
                key += ':' + width + ':' + height + ':' + fit;
                if (key !== sourceKey || !sourceReady) {
                    const factor = Math.min(1, textureLimit / Math.max(width, height));
                    raster.width = Math.max(1, Math.round(width * factor));
                    raster.height = Math.max(1, Math.round(height * factor));
                    const ctx = raster.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    let dw = raster.width, dh = raster.height;
                    if (fit === 'contain' || fit === 'cover') {
                        const scale = Math[fit === 'contain' ? 'min' : 'max'](dw / sourceWidth, dh / sourceHeight);
                        dw = sourceWidth * scale; dh = sourceHeight * scale;
                    }
                    ctx.drawImage(sourceNode, (raster.width - dw) / 2, (raster.height - dh) / 2, dw, dh);
                }
                source = raster;
                sourceWidth = raster.width;
                sourceHeight = raster.height;
            }
            if (key !== sourceKey || !sourceReady) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
                sourceKey = key;
            }
            gl.uniform2f(locations.u_sourceSize, sourceWidth, sourceHeight);
            if (!sourceReady) {
                sourceReady = true;
                if (sourceNode instanceof HTMLVideoElement && sourceNode.controls) {
                    // Keep playback controls visible and operable below the processed picture.
                    canvas.style.clipPath = 'inset(0 0 40px 0)';
                }
                else
                    sourceNode.style.opacity = '0';
                canvas.style.visibility = 'visible';
                onError?.('');
            }
            return true;
        }
        catch (error) {
            sourceFailed = true;
            sourceNode.style.opacity = originalOpacity;
            canvas.style.visibility = 'hidden';
            onError?.('Не удалось обработать источник. Для внешнего фото или видео сервер должен разрешать CORS; можно загрузить локальный файл.');
            return false;
        }
    };
    const color = (hex) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
    // Observe the containing surface, leaving canvas pointer-events disabled so editing and links still work.
    const surface = (canvas.dataset.pwbShaderInput === 'page'
        ? canvas.closest('[data-shader-page]')
        : canvas.closest('[data-shader-surface]')) || canvas.parentElement;
    let paused = false, hovered = false, hover = 0, clickAge = 100, pulse = 0;
    let pointerX = 0, pointerY = 0, hasPointer = false, hasClicked = false;
    const mouse = [0.5, 0.5], trail = [0.5, 0.5], clickPosition = [0.5, 0.5];
    const clicks = [];
    const registerClick = (x, y) => {
        hasClicked = true;
        clickPosition[0] = x;
        clickPosition[1] = y;
        clickAge = 0;
        clicks.push({ position: [x, y], age: 0 });
        if (clicks.length > clickCapacity)
            clicks.shift();
    };
    const removers = [];
    const listen = (target, name, handler, capture = false) => {
        target.addEventListener(name, handler, { passive: true, capture });
        removers.push(() => target.removeEventListener(name, handler, capture));
    };
    const sourceError = () => {
        if (sourceFailed || !sourceNode)
            return;
        sourceFailed = true;
        sourceNode.style.opacity = originalOpacity;
        canvas.style.visibility = 'hidden';
        onError?.('Источник недоступен для обработки. Проверьте файл или используйте фото / видео с разрешённым CORS. Оригинал сохранён.');
        // CORS-blocked media can still be displayed normally without sampling its pixels.
        if ((sourceNode instanceof HTMLImageElement || sourceNode instanceof HTMLVideoElement) && sourceNode.hasAttribute('crossorigin')) {
            const url = sourceNode.src;
            sourceNode.removeAttribute('crossorigin');
            sourceNode.src = url;
        }
    };
    if (usesSource && sourceNode) {
        listen(sourceNode, 'error', sourceError);
        if (sourceNode instanceof HTMLImageElement && sourceNode.complete && !sourceNode.naturalWidth)
            sourceError();
    }
    const locate = () => {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height)
            return null;
        const x = (pointerX - rect.left) / rect.width, y = 1 - (pointerY - rect.top) / rect.height;
        return { x, y, inside: x >= 0 && x <= 1 && y >= 0 && y <= 1 };
    };
    const move = (event) => {
        const e = event;
        if (!e.isPrimary)
            return;
        pointerX = e.clientX;
        pointerY = e.clientY;
        hasPointer = true;
        hovered = locate()?.inside || false;
    };
    const leave = () => { hovered = false; hasPointer = false; };
    // Inactive/locked editor layers have pointer-events:none. Observe the page in capture
    // and test each effect's own bounds, without enabling selection on those layers.
    const pointerRoot = canvas.closest('[data-shader-page]') || surface;
    listen(pointerRoot, 'pointerenter', move, true);
    listen(pointerRoot, 'pointermove', move, true);
    listen(pointerRoot, 'pointerleave', event => { if (event.target === pointerRoot) leave(); }, true);
    listen(pointerRoot, 'pointerdown', event => {
        const e = event;
        if (!e.isPrimary || e.button !== 0 || paused)
            return;
        move(event);
        const pos = locate();
        if (pos?.inside)
            registerClick(pos.x, pos.y);
    }, true);
    listen(surface, 'click', event => {
        // Native keyboard activation has no pointer coordinates.
        if (event.detail !== 0 || paused)
            return;
        registerClick(0.5, 0.5);
    });
    listen(surface, 'focusin', () => { if (!hasPointer)
        hovered = true; });
    listen(surface, 'focusout', leave);
    listen(window, 'pointerup', event => { if (event.pointerType === 'touch')
        leave(); });
    listen(window, 'pointercancel', leave);
    listen(window, 'blur', leave);
    listen(document, 'visibilitychange', leave);
    const draw = (now) => {
        if (stopped)
            return;
        frame = requestAnimationFrame(draw);
        const delta = last ? Math.min((now - last) / 1000, 0.1) : 0;
        last = now;
        if (document.hidden || !canvas.getClientRects().length)
            return;
        const rect = canvas.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth)
            return;
        // One common pixel ratio preserves aspect at every editor/browser zoom.
        const ratio = Math.min(devicePixelRatio || 1, 2, 2048 / Math.max(1, rect.width), 2048 / Math.max(1, rect.height));
        const w = Math.max(1, Math.round(rect.width * ratio)), h = Math.max(1, Math.round(rect.height * ratio));
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
        const mode = config.interactive === false ? 'none' : config.interaction || 'none';
        if (!paused) {
            if (config.animated !== false)
                time += delta * config.speed;
            clicks.forEach(click => { click.age += delta; });
            while (clicks.length && clicks[0].age >= 1.8)
                clicks.shift();
            const demo = canvas.dataset.pwbShaderDemo === 'true' && !hasPointer && !hasClicked && mode !== 'none';
            const pos = hasPointer ? locate() : demo ? { x: 0.5 + Math.sin(time * 0.9) * 0.22, y: 0.5 + Math.cos(time * 1.1) * 0.17, inside: true } : null;
            if (pos)
                hovered = pos.inside;
            const response = config.response ?? 0.18;
            const blend = response === 0 ? 1 : 1 - Math.exp(-delta / response);
            hover += ((hovered ? 1 : 0) - hover) * blend;
            const active = mode !== 'none';
            const x = active && pos?.inside ? pos.x : mouse[0];
            const y = active && pos?.inside ? pos.y : mouse[1];
            mouse[0] += (x - mouse[0]) * blend;
            mouse[1] += (y - mouse[1]) * blend;
            const lag = 1 - Math.exp(-delta / Math.max(0.12, response * 3));
            trail[0] += (mouse[0] - trail[0]) * lag;
            trail[1] += (mouse[1] - trail[1]) * lag;
            clickAge = demo && mode === 'click' ? time % 2.2 : Math.min(100, clickAge + delta);
            pulse = Math.max(0, 1 - clickAge / 1.8);
        }
        gl.viewport(0, 0, w, h);
        gl.useProgram(program);
        const pageBackground = canvas.dataset.pwbShaderInput === 'page';
        // Backgrounds fit the page proportions; CSS/editor zoom changes only raster resolution.
        // Objects keep their document dimensions so their local effects retain the chosen size.
        const responsive = pageBackground || canvas.dataset.pwbShaderResponsive === 'true';
        const logicalWidth = Math.max(1, (responsive ? canvas.clientWidth : Number(canvas.dataset.pwbShaderWidth)) || canvas.clientWidth || rect.width);
        const logicalHeight = Math.max(1, (responsive ? canvas.clientHeight : Number(canvas.dataset.pwbShaderHeight)) || canvas.clientHeight || rect.height);
        const surfaceHeight = pageBackground ? 1080 : logicalHeight;
        const surfaceWidth = pageBackground ? logicalWidth / logicalHeight * 1080 : logicalWidth;
        const size = config.size ?? 100;
        const density = surfaceHeight / 360 * (100 / size);
        const designCoordinates = locations.u_surfaceSize !== null;
        gl.uniform2f(locations.u_resolution, w, h);
        gl.uniform2f(locations.u_surfaceSize, surfaceWidth, surfaceHeight);
        gl.uniform1f(locations.u_size, size);
        gl.uniform1f(locations.u_time, config.animated === false ? 0 : time);
        gl.uniform1f(locations.pwbReplaySpeed, config.animated === false ? 0 : config.speed);
        gl.uniform1f(locations.pwbReplayAmount, config.opacity);
        // Old GLSL files retain their source; adapt the existing uniforms instead.
        gl.uniform1f(locations.u_scale, config.scale * ((designCoordinates || usesSource) ? 1 : density));
        gl.uniform1f(locations.u_intensity, config.intensity);
        gl.uniform3fv(locations.u_colorA, color(config.colorA));
        gl.uniform3fv(locations.u_colorB, color(config.colorB));
        gl.uniform2fv(locations.u_mouse, mode === 'none' ? [0.5, 0.5] : mouse);
        gl.uniform2fv(locations.u_trail, mode === 'none' ? [0.5, 0.5] : trail);
        gl.uniform2fv(locations.u_clickPosition, clickPosition);
        gl.uniform1f(locations.u_hover, mode === 'none' ? 1 : hover);
        const staticClick = config.interactive === false && config.interaction === 'click';
        gl.uniform1f(locations.u_click, staticClick ? 1 : mode === 'none' ? 0 : pulse);
        gl.uniform1f(locations.u_clickAge, staticClick ? 0.45 : clickAge);
        gl.uniform1f(locations.u_radius, (config.radius ?? 0.18) / (designCoordinates ? 1 : density * config.scale));
        gl.uniform1f(locations.u_strength, config.strength ?? 1);
        if (multiClicks) {
            const demoClick = canvas.dataset.pwbShaderDemo === 'true' && !hasPointer && !hasClicked && mode === 'click';
            const activeClicks = mode !== 'click' ? [{ position: mode === 'none' ? [0.5, 0.5] : mouse, age: 0.45 }] : demoClick ? [{ position: [0.5, 0.5], age: clickAge }] : clicks;
            const values = new Float32Array(clickCapacity * 3);
            activeClicks.forEach((click, i) => { values[i * 3] = click.position[0]; values[i * 3 + 1] = click.position[1]; values[i * 3 + 2] = click.age; });
            gl.uniform3fv(locations.u_clicks, values);
            gl.uniform1f(locations.u_clickCount, activeClicks.length);
        }
        const amount = config.opacity * (mode === 'hover' ? hover : mode === 'click' && !multiClicks ? pulse : 1);
        gl.uniform1f(locations.u_amount, amount);
        canvas.style.opacity = String(usesSource ? 1 : amount);
        if (!uploadSource(w, h))
            return;
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    const lost = (event) => { event.preventDefault(); cancelAnimationFrame(frame); if (sourceNode)
        sourceNode.style.opacity = originalOpacity; canvas.style.visibility = 'hidden'; onError?.('Контекст WebGL потерян. Откройте редактор заново.'); };
    canvas.addEventListener('webglcontextlost', lost);
    if (!usesSource)
        onError?.('');
    else if (!sourceNode)
        onError?.('Выберите совместимый объект для предпросмотра.');
    frame = requestAnimationFrame(draw);
    return { update(next) {
            if (next.interaction !== config.interaction) {
                clickAge = 100;
                pulse = 0;
                clicks.length = 0;
                hasClicked = false;
            }
            config = next;
        }, setPaused(value) { paused = value; }, dispose() { stopped = true; removers.forEach(remove => remove()); cancelAnimationFrame(frame); canvas.removeEventListener('webglcontextlost', lost); release(); } };
}

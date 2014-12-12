var audio, canvas, context;
var smokeCanvas, smokeContext, bufferCanvas, bufferContext;
var pi = 4 * Math.atan(1);

var currentTime, beat, beatPart, pattern, patternPart, floatPattern;

var raf = function(func) {
    var wrapper = (function(func) {
        return function() {
            if (demo.audio) {
                currentTime = demo.audio.currentTime + 1 / 60;
                var floatBeat = currentTime * 44100 / song.rowLen;
                
                beat = floatBeat | 0;
                beatPart = floatBeat - beat;
                pattern = beat >> 5;
                beat &= 31;
                patternPart = (floatBeat / 32) - pattern;
                floatPattern = floatBeat / 32;
            }
            func();
        }
    })(func);
    requestAnimationFrame(wrapper);
};

var rgba = function(r, g, b, a) {
    return "rgba(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + "," + a.toFixed(3) + ")";
};

var smooth = function(from, to, unsmoothDistance) {
    var value = Math.max(0, Math.min(1, unsmoothDistance));
    return from + (to - from) * (Math.cos(value * pi) * -0.5 + 0.5);
};

// This function autocloses
var poly = function(poly, ctx) {
    ctx = ctx || context;
    ctx.moveTo(poly[0], poly[1]);
    
    for (var i = 2; i < poly.length; i += 2) {
        ctx.lineTo(poly[i], poly[i + 1]);
    }
    
    ctx.lineTo(poly[0], poly[1]);
};

var polyPoly = function(polys, ctx) {
    ctx = ctx || context;
    ctx.beginPath();
    for (var i = 0; i < polys.length; ++i) {
        poly(polys[i], ctx);
    }
};

// http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
var hue2rgb = function(p, q, t){
    if(t < 0) t += 1;
    if(t > 1) t -= 1;
    if(t < 1/6) return p + (q - p) * 6 * t;
    if(t < 1/2) return q;
    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
}
var hslToRgb = function (h, s, l){
    var r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return {r : r * 255, g : g * 255, b : b * 255};
};

var demo = {
    init : function() {
        demo.player = new CPlayer();
        demo.player.init(song);
        canvas = document.createElement("CANVAS");
        canvas.width = 640;
        canvas.height = 512;
        context = canvas.getContext("2d");
        
        smokeCanvas = document.createElement("CANVAS");
        smokeCanvas.width = 840;
        smokeCanvas.height = 712;
        smokeContext = smokeCanvas.getContext("2d");
        
        bufferCanvas = document.createElement("CANVAS");
        bufferCanvas.width = 840;
        bufferCanvas.height = 712;
        bufferContext = bufferCanvas.getContext("2d");
        
        demo.renderInit(0);
        
        document.body.appendChild(canvas);
        raf(demo.generateSongPart);
    },
    
    generateSongPart : function() {
        var result = demo.player.generate();
        demo.renderInit(result * 0.8);

        if (result < 1) {
            raf(demo.generateSongPart);
        } else {
            raf(demo.generateWave);
        }
    },
    
    generateWave : function() {
        demo.wave = demo.player.createWave();
        demo.renderInit(0.9);
        raf(demo.waitForFonts);
    },
    
    waitForFonts : function() {
        var span1, span2;
        
        if (!demo.fontTester) {
            var div = demo.fontTester = document.createElement("DIV");
            div.style.position = "absolute";
            div.style.left = "-1000px";
            div.style.top = "-1000px";
            
            span1 = demo.fontTester1 = document.createElement("SPAN");
            span1.style.fontSize = "100px";
            span1.style.fontFamily = "'Titan One', mono-space";
            span1.innerHTML = "i";
            
            span2 = demo.fontTester2 = document.createElement("SPAN");
            span2.style.fontSize = "100px";
            span2.style.fontFamily = "'Titan One', mono-space";
            span2.innerHTML = "W";
            
            div.appendChild(span1);
            div.appendChild(span2);
            document.body.appendChild(div);
        } else {
            span1 = demo.fontTester1;
            span2 = demo.fontTester2;
        }
        
        if (span1.offsetWidth == span2.offsetWidth) {
            raf(demo.waitForFonts);
        } else {
            document.body.removeChild(demo.fontTester);
            demo.renderInit(1);
            raf(demo.run);
        }
    },
    
    renderInit : function(done) {
        context.clearRect(0, 0, 640, 512);
        context.lineCap = "round";
        
        context.lineWidth = 50;
        context.strokeStyle = "#225599";
        context.beginPath();
        context.moveTo(100, 256);
        context.lineTo(540, 256);
        context.stroke();
        
        context.lineWidth = 45;
        context.strokeStyle = "#000000";
        context.beginPath();
        context.moveTo(100, 256);
        context.lineTo(540, 256);
        context.stroke();
        
        context.lineWidth = 40;
        context.strokeStyle = "#225599";
        context.beginPath();
        context.moveTo(100, 256);
        context.lineTo(100 + 440 * done, 256);
        context.stroke();
    },
    
    onAudioPlay : function(event) {
        this.style.display = "none";
    },
    
    run : function() {
        var audio = demo.audio = document.createElement("AUDIO");
        audio.controls = true;
        audio.src = URL.createObjectURL(new Blob([demo.wave], {type : "audio/wav"}));
        document.body.appendChild(audio);
        audio.addEventListener("play", demo.onAudioPlay, false);
        audio.play();
        raf(demo.renderSwirl);
    },
    
    renderFlying : function() {
        context.clearRect(0, 0, 640, 512);
        context.font = "normal normal 30px Helvetica,Arial,sans-serif";
        context.textBaseline = "top";
        context.fillStyle = "#000000";
        context.fillText("To do: make this part beautiful...", 10, 10);
    },
    
    renderSwirl : function() {
        if (pattern >= 14) {
            // Go to next part of the demo
            demo.renderFlying();
            return;
        }
        
        // This is the center of the hurricane
        var cx = Math.sin(currentTime * 0.57) * 20;
        var cy = Math.sin(currentTime * 0.73 + 1) * 20;
        
        // Get base color of hurricane
        var r, g, b;
        var hue = (floatPattern < 7.8) ? floatPattern / 7.8 : floatPattern - 6.8;
        hue = (hue + 0.6) % 1;
        
        var color = hslToRgb(hue, 1, 0.5);
        r = color.r * 0.83;
        g = color.g * 0.67;
        b = color.b;
        
        // Clear
        context.clearRect(0, 0, 640, 512);
        
        // Add random hurricane entropy at the center
        for (var i = 0; i < 8; ++i) {
            var x = Math.random() * 20 + 410 + cx * 1.2;
            var y = Math.random() * 20 + 346 + cy * 1.2;
            var radius = Math.random() * 10 + 10;
            smokeContext.fillStyle = (i & 1) ?
                                        rgba(r / 4, g / 4, b / 4, Math.random() * 0.4 + 0.01) :
                                        rgba(r / 4 + 191, g / 4 + 191, b / 4 + 191, Math.random() * 0.4 + 0.01);
            smokeContext.beginPath();
            smokeContext.arc(x, y, radius, 0, 2 * pi, false);
            smokeContext.fill();
        }
        
        // This is the hurricane magic - rotate and scale through a buffer
        smokeContext.save();
        bufferContext.fillStyle = "#ffffff";
        bufferContext.fillRect(0, 0, 840, 712);
        bufferContext.drawImage(smokeCanvas, 0, 0);
        smokeContext.translate(420 + cx, 356 + cy);
        smokeContext.rotate(0.02);
        smokeContext.scale(1.01, 1.01);
        smokeContext.translate(-420 - cx, -356 - cy);
        smokeContext.drawImage(bufferCanvas, 0, 0);
        smokeContext.restore();
        
        // During the first two patterns (0, 1) the hurricane is slowly faded in
        var opacity = (pattern <= 1) ? (pattern + patternPart) / 2 : 1;
        
        // Draw the hurricane from the buffer to screen
        context.globalAlpha = opacity;
        context.drawImage(smokeCanvas, cx-100, cy-100);
        context.globalAlpha = 1;
        
        // Cover the middle entropy bits with a nice gradeint
        var middleGradient = context.createRadialGradient(cx * 2+320, cy * 2+256, 10, cx * 2+320, cy * 2+256, 120);
        var r1 = 255 + (r / 8 + 16 - 255) * opacity,
            g1 = 255 + (g / 8 + 16 - 255) * opacity,
            b1 = 255 + (b / 8 + 16 - 255) * opacity,
            r2 = 255 + (r / 4 + 96 - 255) * opacity,
            g2 = 255 + (g / 4 + 96 - 255) * opacity,
            b2 = 255 + (b / 4 + 96 - 255) * opacity;
        middleGradient.addColorStop(0.1, "rgba(" + (r1 | 0) + "," + (g1 | 0) + "," + (b1 | 0) + ",0.99");
        middleGradient.addColorStop(0.2, "rgba(" + (r1 | 0) + "," + (g1 | 0) + "," + (b1 | 0) + ",0.9");
        middleGradient.addColorStop(1, "rgba(" + (r2 | 0) + "," + (g2 | 0) + "," + (b2 | 0) + ",0");
        
        context.fillStyle = middleGradient;
        context.beginPath();
        context.arc(cx * 2+320, cy * 2+256, 120, 0, 2 * pi, false);
        context.fill();
        
        // render the music bars
        context.lineCap = "butt";
        
        var beatGradient = context.createLinearGradient(0, 20, 0, 80);
        beatGradient.addColorStop(0, "#ff0000");
        beatGradient.addColorStop(0.5, "#ffff00");
        beatGradient.addColorStop(0.8, "#00ff00");
        
        for (var i = 0; i < 4; ++i) {
            context.lineWidth = 52;
            
            context.beginPath();
            context.moveTo(i * 64 + 48, 82);
            context.lineTo(i * 64 + 48, 18);
            context.strokeStyle = "rgba(255,255,255,0.5)";
            context.stroke();
            
            context.lineWidth = 48;
            context.strokeStyle = beatGradient;
            
            var instr = song.songData[i];
            if (instr && i != 2) {
                var patternIndex = instr.p[pattern];
                if (patternIndex) {
                    var column = instr.c[patternIndex - 1].n;
                    if (column) {
                        var note = column[beat];
                        if (note) {
                            context.beginPath();
                            context.moveTo(i * 64 + 48, 80);
                            context.lineTo(i * 64 + 48, 20 + 60 * beatPart);
                            context.stroke();
                        }
                    }
                }
            } else if (i == 2 && pattern >= 8) {
                var loudness = (patternPart < 0.05) ? patternPart * 10 + 0.5 :
                               (patternPart > 0.95) ? (1 - patternPart) * 10 + 0.5 :
                               1;
                loudness = loudness * 0.7 + 0.1 * Math.sin(currentTime * 5.3);
                context.beginPath();
                context.moveTo(i * 64 + 48, 80);
                context.lineTo(i * 64 + 48, 80 - 60 * loudness);
                context.stroke();
            }
        }
        
        // Render names of music bars
        context.fillStyle = "#000000";
        context.strokeStyle = "rgba(255,255,255,0.5)";

        // 1. clav
        var clavSizeOffset = floatPattern;
        var clavSize = smooth(10, 1, clavSizeOffset * 2);
        clavSize *= clavSize;
        context.lineWidth = 1 + 1 / clavSize;
        context.save();
        context.translate(24 + 3, 80);
        context.scale(clavSize, clavSize);
        context.translate(0 - 3, 5);
        context.rotate(smooth(1, 0, clavSizeOffset * 2));
        
        polyPoly([
            // c
            [6, 4,
             2, 4,
             2, 12,
             6, 12,
             6, 10,
             0, 10,
             0, 6,
             6, 6],
            
            // l
            [8, 0,
             10, 0,
             10, 12,
             12, 12,
             12, 10,
             8, 10],
            
            // a
            [22, 4,
             16, 4,
             16, 12,
             18, 12,
             18, 10,
             14, 10,
             14, 6,
             20, 6,
             20, 8,
             18, 8,
             18, 10,
             20, 10,
             20, 12,
             22, 12],
            
            // v
            [24, 4,
             24, 8,
             28, 8,
             28, 12,
             30, 12,
             30, 8,
             34, 8,
             34, 4,
             32, 4,
             32, 10,
             26, 10,
             26, 4]
        ]);
        
        context.stroke();
        context.fill();
        context.restore();
        
        // 2. bass
        if (pattern >= 2) {
            var bassSizeOffset = floatPattern - 2;
            var bassSize = smooth(10, 1, bassSizeOffset * 2);
            bassSize *= bassSize;
            context.lineWidth = 1 + 1 / bassSize;
            context.save();
            context.translate(24 + 64 + 3, 80);
            context.scale(bassSize, bassSize);
            context.translate(0 - 3, 5);
            context.rotate(smooth(1, 0, bassSizeOffset * 2));
            
            polyPoly([
                [0, 0,
                 0, 12,
                 6, 12,
                 6, 6,
                 8, 6,
                 8, 10,
                 2, 10,
                 2, 6,
                 6, 6,
                 6, 4,
                 2, 4,
                 2, 0],
                
                // a
                [18, 4,
                 12, 4,
                 12, 12,
                 14, 12,
                 14, 10,
                 10, 10,
                 10, 6,
                 16, 6,
                 16, 8,
                 14, 8,
                 14, 10,
                 16, 10,
                 16, 12,
                 18, 12],
                
                // s
                [26, 4,
                 22, 4,
                 22, 6,
                 20, 6,
                 20, 8,
                 28, 8,
                 28, 10,
                 26, 10,
                 26, 12,
                 20, 12,
                 20, 10,
                 24, 10,
                 24, 6,
                 26, 6],
                
                // s
                [36, 4,
                 32, 4,
                 32, 6,
                 30, 6,
                 30, 8,
                 38, 8,
                 38, 10,
                 36, 10,
                 36, 12,
                 30, 12,
                 30, 10,
                 34, 10,
                 34, 6,
                 36, 6]
            ]);
            
            context.stroke();
            context.fill();
            context.restore();
        }
        
        // 3. chrd
        if (pattern >= 8) {
            var chrdSizeOffset = floatPattern - 8;
            var chrdSize = smooth(10, 1, chrdSizeOffset * 2);
            chrdSize *= chrdSize;
            context.lineWidth = 1 + 1 / chrdSize;
            context.save();
            context.translate(24 + 128 + 3, 80);
            context.scale(chrdSize, chrdSize);
            context.translate(0 - 3, 5);
            context.rotate(smooth(1, 0, chrdSizeOffset * 2));
            
            polyPoly([
                // c
                [6, 4,
                 2, 4,
                 2, 12,
                 6, 12,
                 6, 10,
                 0, 10,
                 0, 6,
                 6, 6],
                
                // h
                [8, 0,
                 8, 12,
                 10, 12,
                 10, 6,
                 16, 6,
                 16, 12,
                 14, 12,
                 14, 4,
                 10, 4,
                 10, 0],
                
                // r
                [18, 4,
                 20, 4,
                 20, 6,
                 26, 6,
                 26, 4,
                 22, 4,
                 22, 8,
                 20, 8,
                 20, 12,
                 18, 12],
                
                // d
                [28, 6,
                 30, 6,
                 30, 12,
                 36, 12,
                 36, 0,
                 34, 0,
                 34, 4,
                 30, 4,
                 30, 6,
                 34, 6,
                 34, 10,
                 28, 10
                ]
            ]);
            
            context.stroke();
            context.fill();
            context.restore();
        }
        
        // 3. chrd
        if (pattern >= 13) {
            var drumSizeOffset = floatPattern - 13;
            var drumSize = smooth(10, 1, drumSizeOffset * 2);
            drumSize *= drumSize;
            context.lineWidth = 1 + 1 / drumSize;
            context.save();
            context.translate(24 + 192 + 3, 80);
            context.scale(drumSize, drumSize);
            context.translate(0 - 3, 5);
            context.rotate(smooth(1, 0, drumSizeOffset * 2));
            
            polyPoly([
                // d
                [0, 6,
                 2, 6,
                 2, 12,
                 8, 12,
                 8, 0,
                 6, 0,
                 6, 4,
                 2, 4,
                 2, 6,
                 6, 6,
                 6, 10,
                 0, 10
                ],
                
                // r
                [10, 4,
                 12, 4,
                 12, 6,
                 18, 6,
                 18, 4,
                 14, 4,
                 14, 8,
                 12, 8,
                 12, 12,
                 10, 12],
                
                // u
                [20, 4,
                 20, 10,
                 26, 10,
                 26, 12,
                 28, 12,
                 28, 4,
                 26, 4,
                 26, 8,
                 24, 8,
                 24, 12,
                 22, 12,
                 22, 4
                ],
                
                // m
                [30, 4,
                 30, 12,
                 32, 12,
                 32, 6,
                 40, 6,
                 40, 12,
                 38, 12,
                 38, 4,
                 36, 4,
                 36, 10,
                 34, 10,
                 34, 4]
            ]);
            
            context.stroke();
            context.fill();
            context.restore();
        }
        
        // Render waveform on top of everything
        var snapshot = demo.player.getData(currentTime, 640);
        
        context.beginPath();
        context.fillStyle = "rgba(255, 255, 255, 0.5)";
        context.moveTo(0, 352);
        for (var i = 0; i < 320; ++i) {
            var x = i * 2 + 2;
            var y = 352 + 160 * snapshot[i << 2];
            context.lineTo(x, y);
        }
        context.lineTo(640, 352);
        context.lineTo(640, 512);
        context.lineTo(0, 512);
        context.fill();
        
        context.strokeStyle = "rgba(0, 0, 0, 0.5)";
        context.beginPath();
        context.lineWidth = 3;
        for (var i = 0; i < 320; ++i) {
            var x = i * 2 + 2;
            var y = 352 + 160 * snapshot[i << 2];
            if (i) {
                context.lineTo(x, y);
            } else {
                context.moveTo(x, y);
            }
        }
        context.stroke();
        
        // Finally: The mandatory text scroller
        /*
        var text = "Welcome to the \"Ache\" demo by Anders \"LBRTW\" Tornblad!";
        var textFill = context.createLinearGradient(0, 440, 0, 500);
        textFill.addColorStop(0.1, "#33ddff");
        textFill.addColorStop(0.6, "#ffffff");
        textFill.addColorStop(0.6, "#771199");
        textFill.addColorStop(0.9, "#ddccff");
        context.fillStyle = textFill;
        
        var textStroke = context.createLinearGradient(0, 440, 0, 500);
        textStroke.addColorStop(0.1, "#440022");
        textStroke.addColorStop(0.7, "#552244");
        textStroke.addColorStop(0.9, "#110022");
        context.strokeStyle = textStroke;
        
        context.textBaseline = "top";
        
        context.lineWidth = 3;
        context.font = "normal normal 60px 'Titan One'";
        var textX = 700 - 190 * floatPattern;
        context.fillText(text, textX, 442);
        context.strokeText(text, textX, 442);
        */
        
        // When the drums start beating, do this pretty thing...
        if (pattern == 13 && beat >= 28) {
            context.beginPath();
            
            var radiusX = (beat - 27) * 350 / 4;
            var radiusY = (beat - 27) * 286 / 4;
            
            var radius2 = (beat - 27) * 24;
            
            for (var i = 0; i <= 70; ++i) {
                var angle = i / 35 * pi;
                var angle2 = (i + beat) / 7 * pi;
                var px = 320 + Math.sin(angle) * (radiusX + Math.abs(Math.sin(angle2)) * radius2);
                var py = 256 + Math.cos(angle) * (radiusY + Math.abs(Math.sin(angle2)) * radius2);
                
                if (i) {
                    context.lineTo(px, py);
                } else {
                    context.moveTo(px, py);
                }
            }
            
            context.fillStyle = "#ffffff";
            context.strokeStyle = "#000000";
            context.lineWidth = 3;
            context.fill();
            context.stroke();
        }
        
        raf(demo.renderSwirl);
    },
    
    windowLoad : function() {
        raf(demo.init);
    }
};

addEventListener("load", demo.windowLoad, false);

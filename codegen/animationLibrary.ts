export const ANIMATION_LIBRARY = `/* ============================================================
   POWERWEB ELEMENT ANIMATIONS — 35+ EFFECTS
   ============================================================ */

/* --- ENTRANCE --- */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.anim-fadeIn { animation-name: fadeIn; }

@keyframes fadeInUp { from { opacity: 0; transform: translate3d(0, 60px, 0); } to { opacity: 1; transform: none; } }
.anim-fadeInUp { animation-name: fadeInUp; }

@keyframes fadeInDown { from { opacity: 0; transform: translate3d(0, -60px, 0); } to { opacity: 1; transform: none; } }
.anim-fadeInDown { animation-name: fadeInDown; }

@keyframes fadeInLeft { from { opacity: 0; transform: translate3d(-80px, 0, 0); } to { opacity: 1; transform: none; } }
.anim-fadeInLeft { animation-name: fadeInLeft; }

@keyframes fadeInRight { from { opacity: 0; transform: translate3d(80px, 0, 0); } to { opacity: 1; transform: none; } }
.anim-fadeInRight { animation-name: fadeInRight; }

@keyframes zoomIn { from { opacity: 0; transform: scale3d(0.3,0.3,0.3); } 50% { opacity: 1; } to { opacity: 1; transform: scale3d(1,1,1); } }
.anim-zoomIn { animation-name: zoomIn; }

@keyframes zoomInUp { from { opacity: 0; transform: scale3d(0.1,0.1,0.1) translate3d(0,1000px,0); } 60% { opacity: 1; transform: scale3d(0.475,0.475,0.475) translate3d(0,-60px,0); } to { opacity: 1; transform: scale3d(1,1,1); } }
.anim-zoomInUp { animation-name: zoomInUp; }

@keyframes bounceIn { 0% { opacity: 0; transform: scale3d(0.3,0.3,0.3); } 20% { transform: scale3d(1.1,1.1,1.1); } 40% { transform: scale3d(0.9,0.9,0.9); } 60% { opacity: 1; transform: scale3d(1.03,1.03,1.03); } 80% { transform: scale3d(0.97,0.97,0.97); } to { opacity: 1; transform: scale3d(1,1,1); } }
.anim-bounceIn { animation-name: bounceIn; }

@keyframes slideInUp { from { transform: translate3d(0,100%,0); opacity: 0; } to { transform: none; opacity: 1; } }
.anim-slideInUp { animation-name: slideInUp; }

@keyframes slideInLeft { from { transform: translate3d(-100%,0,0); opacity: 0; } to { transform: none; opacity: 1; } }
.anim-slideInLeft { animation-name: slideInLeft; }

@keyframes slideInRight { from { transform: translate3d(100%,0,0); opacity: 0; } to { transform: none; opacity: 1; } }
.anim-slideInRight { animation-name: slideInRight; }

@keyframes flipInX { from { transform: perspective(400px) rotate3d(1,0,0,90deg); opacity: 0; } 40% { transform: perspective(400px) rotate3d(1,0,0,-20deg); } 60% { transform: perspective(400px) rotate3d(1,0,0,10deg); opacity: 1; } 80% { transform: perspective(400px) rotate3d(1,0,0,-5deg); } to { transform: perspective(400px); opacity: 1; } }
.anim-flipInX { animation-name: flipInX; }

@keyframes flipInY { from { transform: perspective(400px) rotate3d(0,1,0,90deg); opacity: 0; } 40% { transform: perspective(400px) rotate3d(0,1,0,-20deg); } 60% { transform: perspective(400px) rotate3d(0,1,0,10deg); opacity: 1; } 80% { transform: perspective(400px) rotate3d(0,1,0,-5deg); } to { transform: perspective(400px); opacity: 1; } }
.anim-flipInY { animation-name: flipInY; }

@keyframes rollIn { from { opacity: 0; transform: translate3d(-100%,0,0) rotate3d(0,0,1,-120deg); } to { opacity: 1; transform: none; } }
.anim-rollIn { animation-name: rollIn; }

@keyframes backInDown { from { opacity: 0.7; transform: translateY(-1200px) scale(0.7); } 80% { opacity: 0.7; transform: translateY(0) scale(0.7); } to { opacity: 1; transform: scale(1); } }
.anim-backInDown { animation-name: backInDown; }

@keyframes backInUp { from { opacity: 0.7; transform: translateY(1200px) scale(0.7); } 80% { opacity: 0.7; transform: translateY(0) scale(0.7); } to { opacity: 1; transform: scale(1); } }
.anim-backInUp { animation-name: backInUp; }

@keyframes rotateIn { from { transform: rotate3d(0,0,1,-200deg); opacity: 0; } to { transform: none; opacity: 1; } }
.anim-rotateIn { animation-name: rotateIn; transform-origin: center; }

@keyframes lightSpeedIn { from { transform: translateX(100%) skewX(-30deg); opacity: 0; } 60% { transform: skewX(20deg); opacity: 1; } 80% { transform: skewX(-5deg); } to { transform: none; opacity: 1; } }
.anim-lightSpeedIn { animation-name: lightSpeedIn; animation-timing-function: ease-out !important; }

/* --- ATTENTION --- */
@keyframes pulse { from { transform: scale3d(1,1,1); } 50% { transform: scale3d(1.06,1.06,1.06); } to { transform: scale3d(1,1,1); } }
.anim-pulse { animation-name: pulse; }

@keyframes bounce { from,20%,53%,to { transform: none; } 40%,43% { transform: translate3d(0,-24px,0) scaleY(1.1); } 70% { transform: translate3d(0,-12px,0) scaleY(1.05); } 90% { transform: translate3d(0,-4px,0) scaleY(1.02); } }
.anim-bounce { animation-name: bounce; transform-origin: center bottom; }

@keyframes shake { from,to { transform: none; } 10%,30%,50%,70%,90% { transform: translate3d(-6px,0,0); } 20%,40%,60%,80% { transform: translate3d(6px,0,0); } }
.anim-shake { animation-name: shake; }

@keyframes swing { 20% { transform: rotate3d(0,0,1,15deg); } 40% { transform: rotate3d(0,0,1,-10deg); } 60% { transform: rotate3d(0,0,1,5deg); } 80% { transform: rotate3d(0,0,1,-5deg); } to { transform: none; } }
.anim-swing { animation-name: swing; transform-origin: top center; }

@keyframes rubberBand { from { transform: scale3d(1,1,1); } 30% { transform: scale3d(1.25,0.75,1); } 40% { transform: scale3d(0.75,1.25,1); } 50% { transform: scale3d(1.15,0.85,1); } 65% { transform: scale3d(0.95,1.05,1); } 75% { transform: scale3d(1.05,0.95,1); } to { transform: scale3d(1,1,1); } }
.anim-rubberBand { animation-name: rubberBand; }

@keyframes jello { from,11.1%,to { transform: none; } 22.2% { transform: skewX(-12.5deg) skewY(-12.5deg); } 33.3% { transform: skewX(6.25deg) skewY(6.25deg); } 44.4% { transform: skewX(-3.125deg) skewY(-3.125deg); } 55.5% { transform: skewX(1.5625deg) skewY(1.5625deg); } 66.6% { transform: skewX(-0.78125deg) skewY(-0.78125deg); } 77.7% { transform: skewX(0.390625deg) skewY(0.390625deg); } 88.8% { transform: skewX(-0.1953125deg) skewY(-0.1953125deg); } }
.anim-jello { animation-name: jello; transform-origin: center; }

@keyframes wobble { from { transform: none; } 15% { transform: translate3d(-25%,0,0) rotate3d(0,0,1,-5deg); } 30% { transform: translate3d(20%,0,0) rotate3d(0,0,1,3deg); } 45% { transform: translate3d(-15%,0,0) rotate3d(0,0,1,-3deg); } 60% { transform: translate3d(10%,0,0) rotate3d(0,0,1,2deg); } 75% { transform: translate3d(-5%,0,0) rotate3d(0,0,1,-1deg); } to { transform: none; } }
.anim-wobble { animation-name: wobble; }

@keyframes tada { from { transform: scale3d(1,1,1); } 10%,20% { transform: scale3d(0.9,0.9,0.9) rotate3d(0,0,1,-3deg); } 30%,50%,70%,90% { transform: scale3d(1.1,1.1,1.1) rotate3d(0,0,1,3deg); } 40%,60%,80% { transform: scale3d(1.1,1.1,1.1) rotate3d(0,0,1,-3deg); } to { transform: scale3d(1,1,1); } }
.anim-tada { animation-name: tada; }

@keyframes flash { from,50%,to { opacity: 1; } 25%,75% { opacity: 0; } }
.anim-flash { animation-name: flash; }

@keyframes heartBeat { 0% { transform: scale(1); } 14% { transform: scale(1.3); } 28% { transform: scale(1); } 42% { transform: scale(1.3); } 70% { transform: scale(1); } }
.anim-heartBeat { animation-name: heartBeat; animation-timing-function: ease-in-out !important; }

/* --- CONTINUOUS --- */
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.anim-spin { animation-name: spin; animation-timing-function: linear !important; }

@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
.anim-float { animation-name: float; animation-timing-function: ease-in-out !important; }

@keyframes glow { 0%,100% { opacity: 1; } 50% { opacity: 0.5; filter: brightness(1.5); } }
.anim-glow { animation-name: glow; animation-timing-function: ease-in-out !important; }

/* --- EXIT --- */
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
.anim-fadeOut { animation-name: fadeOut; }

@keyframes zoomOut { from { opacity: 1; } 50% { opacity: 0; transform: scale3d(0.3,0.3,0.3); } to { opacity: 0; } }
.anim-zoomOut { animation-name: zoomOut; }

@keyframes slideOutDown { from { transform: none; } to { opacity: 0; transform: translate3d(0,100%,0); } }
.anim-slideOutDown { animation-name: slideOutDown; }

/* --- LEGACY --- */
@keyframes scaleUp { from { transform: scale(1); } to { transform: scale(1.1); } }
.anim-scaleUp { animation-name: scaleUp; }
@keyframes slideUp { from { transform: translate3d(0,100%,0); opacity: 0; } to { transform: none; opacity: 1; } }
.anim-slideUp { animation-name: slideUp; }
`;

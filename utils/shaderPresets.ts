import { ShaderConfig, ShaderInteraction } from '../types/shaders';
const header = `precision mediump float;
uniform vec2 u_resolution, u_surfaceSize;
uniform float u_size;
uniform float u_time, u_scale, u_intensity;
uniform vec3 u_colorA, u_colorB;
uniform vec2 u_mouse, u_trail, u_clickPosition;
uniform vec3 u_clicks[12];
uniform float u_clickCount;
uniform float u_hover, u_click, u_clickAge, u_radius, u_strength;
// uv: coordinates, t: animated time
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  // 360 document pixels form one unit; resizing the layer does not enlarge the effect.
  vec2 metric = u_surfaceSize / 360.0 * (100.0 / u_size) * u_scale;
  vec2 p = (uv - 0.5) * metric;
  // A gentle parallax also makes the background presets respond to the pointer.
  p -= (u_mouse - 0.5) * u_hover * u_strength * 0.4;
  float t = u_time;
`;
const definitions = [
  ['aurora','Северное сияние','#45efb2','#7348ef', 'float v = sin(p.x*3.0+t+sin(p.y*4.0-t)*1.3)*0.5+0.5; float glow = exp(-abs(p.y+sin(p.x*2.0+t)*0.3)*3.0); vec3 c = mix(u_colorA,u_colorB,v)*glow;'],
  ['plasma','Плазма','#f82b8b','#4074ff','float v = sin(p.x*5.0+t)+sin(p.y*6.0-t)+sin(length(p)*8.0-t*2.0); vec3 c = mix(u_colorA,u_colorB,0.5+0.5*sin(v));'],
  ['liquid','Жидкий металл','#c9e9ff','#4c48b5','float v = sin(p.x*5.0+sin(p.y*7.0+t))+cos(p.y*4.0+sin(p.x*6.0-t)); float shine = pow(0.5+0.5*sin(v*3.0+t),8.0); vec3 c = mix(u_colorA,u_colorB,0.5+0.5*cos(v*2.0))+shine*0.6;'],
  ['ripple','Волны','#20d9f0','#153c8c','float r = length(p); float v = sin(r*28.0-t*3.0)/(1.0+r*3.0); vec3 c = mix(u_colorA,u_colorB,0.5+0.5*v);'],
  ['lava','Лава','#ff3b19','#ffc44d','vec2 q = p; for(int i=0;i<4;i++){ q += vec2(sin(q.y*3.0+t*0.3),cos(q.x*3.0-t*0.4))*0.3; } float v=sin(q.x*6.0)*cos(q.y*5.0); vec3 c=mix(u_colorA*0.12,u_colorB,smoothstep(-0.2,0.7,v)); c+=u_colorA*(0.5+0.5*sin(v*4.0));'],
  ['galaxy','Звёздная пыль','#8549f5','#56d7ff','float r=length(p); float a=atan(p.y,p.x+0.0001); float fog=0.5+0.5*sin(a*3.0-r*13.0+t); vec2 cell=floor((p+vec2(t*0.01,0.0))*90.0); float star=step(0.994,fract(sin(dot(cell,vec2(127.1,311.7)))*4375.58)); vec3 c=mix(u_colorA,u_colorB,fog)*exp(-r*2.0)*fog+star;'],
  ['grid','Неоновая сетка','#15ffe4','#4f27cf','vec2 q=p*7.0+vec2(t*0.3,-t*0.5); vec2 g=abs(fract(q)-0.5); float line=1.0-smoothstep(0.01,0.06,min(g.x,g.y)); vec3 c=mix(u_colorB*0.12,u_colorA,line)*(0.65+0.35*sin(length(p)*5.0-t));'],
  ['marble','Мрамор','#f2ddc6','#4c687b','float n=sin(p.x*3.0+t*0.2)+sin(p.y*5.0-t*0.15); float v=sin(p.x*9.0+n*3.0+sin(p.y*8.0)*0.5); vec3 c=mix(u_colorA,u_colorB,pow(abs(v),9.0));'],
  ['sunset','Закат','#ff9b57','#982a95','float v=uv.y+sin(p.x*3.0+t*0.4)*0.12; float sun=1.0-smoothstep(0.18,0.2,length(p-vec2(0.0,0.05))); vec3 c=mix(u_colorA,u_colorB,clamp(v,0.0,1.0))+vec3(1.0,0.65,0.2)*sun*0.6;'],
  ['kaleido','Калейдоскоп','#ff57cb','#30ffe0','float a=atan(p.y,p.x+0.0001); float r=length(p); float v=sin(a*8.0+t)*sin(r*18.0-t*2.0); vec3 c=mix(u_colorA,u_colorB,v*0.5+0.5)*(0.5+0.5*cos(r*12.0+t));'],
] as const;
const extraBackgrounds = [
  ['water-surface','Водная поверхность','#8dfce2','#134b7a','vec2 q=p; float a=length(q-vec2(sin(t*0.3)*0.4,0.2)); float b=length(q+vec2(0.6,cos(t*0.2)*0.3)); float waves=sin(a*28.0-t*2.5)+sin(b*24.0-t*2.0); float crest=pow(0.5+0.25*waves,7.0); vec3 c=mix(u_colorB,u_colorA,crest)+crest*0.3;'],

  ['mesh','Цветная дымка','#ff6c9d','#45d8ff','vec2 q=p; for(int i=0;i<5;i++){q+=vec2(sin(q.y*2.2+t*0.35),cos(q.x*2.4-t*0.3))*0.28;} float v=0.5+0.5*sin(q.x*3.0+q.y*2.0); vec3 c=mix(u_colorA,u_colorB,v); c=mix(c,vec3(0.22,0.12,0.55),0.35+0.25*sin(q.y*4.0));'],
  ['caustics','Свет в воде','#5affdb','#063b78','vec2 q=p*4.0; float v=0.0; for(int i=0;i<4;i++){q+=vec2(sin(q.y+t*0.6),cos(q.x-t*0.5)); v+=1.0/(1.0+abs(sin(q.x)*cos(q.y))*18.0);} vec3 c=mix(u_colorB,u_colorA,clamp(v*0.6,0.0,1.0)); c+=pow(v*0.4,4.0)*0.4;'],
  ['orbital','Орбитальное сияние','#ff8f49','#9057ff','float r=length(p); float a=atan(p.y,p.x+0.001); float ring=exp(-abs(r-0.65-sin(a*3.0+t)*0.12)*16.0); float haze=exp(-r*r*1.2); vec3 c=mix(u_colorB,u_colorA,0.5+0.5*sin(a+t))*ring*1.6+u_colorB*haze*0.22;'],
  ['ribbons','Шёлковые ленты','#5fffe0','#b73eff','float v=sin(p.y*9.0+sin(p.x*3.0+t)*3.0+sin(p.x*6.0-t)*0.8); float silk=pow(0.5+0.5*v,4.0); vec3 c=mix(u_colorB*0.18,u_colorA,silk); c+=u_colorB*pow(1.0-abs(v),6.0)*0.65;'],
] as const;
const ambientPresets = [...definitions,...extraBackgrounds].map(([id,name,colorA,colorB,body]) => ({id, config: {name,colorA,colorB,speed:1,scale:1,size:100,intensity:1,opacity:1,backgroundColor:'#111827',backgroundOpacity:1,
  fragment: header + '  ' + body + '\n  gl_FragColor = vec4(c * u_intensity, 1.0);\n}\n'} as ShaderConfig}));

export interface ShaderPreset {
  id: string;
  category: ShaderInteraction | 'media' | 'text' | 'object';
  description: string;
  config: ShaderConfig;
}
const interactive: {id:string; name:string; mode:ShaderInteraction; description:string; colors:[string,string]; body:string}[] = [
  {id:'cursor-light',name:'Свет за курсором',mode:'pointer',description:'Мягкое цветное свечение следует за мышью.',colors:['#ffb35c','#5531a6'],body:`
    vec2 d = (uv-u_mouse)*metric;
    float light = exp(-dot(d,d)/(u_radius*u_radius))*u_hover*u_strength;
    vec3 c = mix(u_colorB,u_colorA,clamp(light,0.0,1.0)); float alpha=clamp(light*1.5,0.0,1.0);`},
  {id:'magnetic-rings',name:'Магнитные кольца',mode:'pointer',description:'Кольца собираются вокруг указателя и мягко затухают при уходе.',colors:['#29d8dc','#25346c'],body:`
    vec2 d=(uv-u_mouse)*metric;
    float r=length(d); float rings=pow(0.5+0.5*cos(r*45.0-t*2.0),10.0);
    float glow=exp(-r/max(u_radius*2.0,0.01))*u_hover*u_strength;
    vec3 c=u_colorA; float alpha=clamp(rings*glow*2.0,0.0,1.0);`},
  {id:'ink-cursor',name:'Жидкая краска',mode:'pointer',description:'Курсор растягивает и закручивает цветные потоки.',colors:['#f576b4','#6366db'],body:`
    vec2 m=(u_mouse-0.5)*metric;
    vec2 q=p; vec2 d=q-m; q+=sin(d.yx*8.0+t)*exp(-length(d)/u_radius)*u_hover*u_strength*0.35;
    float v=sin(q.x*7.0+sin(q.y*6.0+t))*0.5+0.5;
    vec3 c=mix(u_colorA,u_colorB,v); float alpha=1.0;`},
  {id:'comet-trail',name:'Световой след',mode:'pointer',description:'Световой хвост тянется за движением мыши.',colors:['#ffd77e','#6b46c2'],body:`
    vec2 ratio=metric;
    vec2 a=u_trail*ratio, b=u_mouse*ratio, q=uv*ratio;
    vec2 ab=b-a; float h=clamp(dot(q-a,ab)/max(dot(ab,ab),0.00001),0.0,1.0);
    float r=length(q-mix(a,b,h));
    float glow=exp(-r*r/max(u_radius*u_radius*0.12,0.0001))*u_hover*u_strength;
    vec3 c=mix(u_colorB,u_colorA,h); float alpha=clamp(glow*1.7,0.0,1.0);`},
  {id:'hover-border',name:'Неоновая рамка',mode:'hover',description:'При наведении загорается рамка, блик движется за курсором.',colors:['#ff9846','#f44a89'],body:`
    float edge=min(min(uv.x,1.0-uv.x)*metric.x,min(uv.y,1.0-uv.y)*metric.y);
    float border=exp(-edge/(u_radius*0.12));
    float light=exp(-length((uv-u_mouse)*metric)/u_radius);
    vec3 c=mix(u_colorB,u_colorA,uv.x); float alpha=clamp(border*(0.7+light*u_strength),0.0,1.0);`},
  {id:'hover-bloom',name:'Цветное раскрытие',mode:'hover',description:'Цвет раскрывается от точки наведения и плавно исчезает.',colors:['#ffc778','#fa6286'],body:`
    float r=length((uv-u_mouse)*metric);
    float bloom=1.0-smoothstep(u_hover*(0.4+u_radius*2.0),u_hover*(0.4+u_radius*2.0)+0.25,r);
    vec3 c=mix(u_colorB,u_colorA,clamp(bloom,0.0,1.0)); float alpha=clamp(bloom*u_strength,0.0,1.0);`},
  {id:'click-ripple',name:'Волна от нажатия',mode:'click',description:'Нажмите в любом месте — от этой точки разбегутся круги.',colors:['#4fd9fa','#3545a1'],body:`
    vec3 sum=vec3(0.0); float alpha=0.0;
    for(int i=0;i<12;i++){if(float(i)<u_clickCount){
      float age=u_clicks[i].z;
      float r=length((uv-u_clicks[i].xy)*metric);
      float wave=sin(r*40.0-age*12.0);
      float envelope=exp(-pow((r-age*0.7)/u_radius,2.0));
      float a=envelope*u_strength*max(0.0,1.0-age/1.8);
      sum+=mix(u_colorB,u_colorA,0.5+0.5*wave)*a; alpha+=a;
    }}
    vec3 c=sum/max(alpha,0.0001); alpha=clamp(alpha,0.0,1.0);`},
  {id:'click-burst',name:'Искра',mode:'click',description:'В точке нажатия вспыхивает звезда с расходящимися лучами.',colors:['#fff0bd','#fa6636'],body:`
    vec3 sum=vec3(0.0); float alpha=0.0;
    for(int i=0;i<12;i++){if(float(i)<u_clickCount){
      float age=u_clicks[i].z;vec2 d=(uv-u_clicks[i].xy)*metric;
      float r=length(d),angle=atan(d.y,d.x+0.0001);
      float rays=pow(abs(cos(angle*6.0)),18.0);
      float glow=exp(-r/(u_radius*(0.25+age)))*(0.4+rays);
      float a=glow*u_strength*max(0.0,1.0-age/1.8);
      sum+=mix(u_colorB,u_colorA,exp(-r*8.0))*a;alpha+=a;
    }}
    vec3 c=sum/max(alpha,0.0001);alpha=clamp(alpha,0.0,1.0);`},
];
interactive.push(
  {id:'pointer-water-ripple',name:'Рябь за курсором',mode:'pointer',description:'',colors:['#59e9f3','#173761'],body:`
    vec2 d=(uv-u_mouse)*metric; float r=length(d);
    float wave=sin(r*55.0-t*4.0); float falloff=exp(-r/max(u_radius*2.5,0.01))*u_hover;
    float crest=pow(0.5+0.5*wave,7.0);
    vec3 c=mix(u_colorB,u_colorA,crest); float alpha=clamp(crest*falloff*u_strength,0.0,1.0);`},
  {id:'light-water-ripple',name:'Световая рябь',mode:'pointer',description:'',colors:['#c4faff','#4f70ff'],body:`
    vec2 d=(uv-u_mouse)*metric; float r=length(d);
    float phase=r*46.0-t*3.2;
    float rings=pow(0.5+0.5*cos(phase),18.0);
    float halo=exp(-r/max(u_radius*3.5,0.01))*u_hover;
    vec3 c=mix(u_colorB,u_colorA,rings)+u_colorA*rings*0.7;
    float alpha=clamp((rings+0.07)*halo*u_strength*1.6,0.0,1.0);`},
  {id:'drop-water-ripple',name:'Капля света',mode:'click',description:'',colors:['#c5ffeb','#20a7ff'],body:`
    vec3 sum=vec3(0.0);float alpha=0.0;
    for(int i=0;i<12;i++){if(float(i)<u_clickCount){
      float age=u_clicks[i].z;float r=length((uv-u_clicks[i].xy)*metric);
      float front=age*0.75;
      float wave=pow(0.5+0.5*cos((r-front)*65.0),10.0);
      float envelope=exp(-pow((r-front)/max(u_radius*1.5,0.01),2.0));
      float a=wave*envelope*u_strength*1.8*max(0.0,1.0-age/1.8);
      sum+=(mix(u_colorB,u_colorA,wave)+u_colorA*wave*0.6)*a;alpha+=a;
    }}
    vec3 c=sum/max(alpha,0.0001);alpha=clamp(alpha,0.0,1.0);`}
);
const surfacePresets: ShaderPreset[] = [
  ...interactive.map(preset=>({id:preset.id,category:preset.mode,description:preset.description,config:{
    name:preset.name,fragment:header+preset.body+'\n  gl_FragColor = vec4(c * u_intensity, alpha);\n}\n',
    colorA:preset.colors[0],colorB:preset.colors[1],speed:1,scale:1,size:100,intensity:1,opacity:1,
    interaction:preset.mode,response:0.18,radius:0.28,strength:1.45,backgroundColor:'#111827',backgroundOpacity:1,
  }})),
  ...ambientPresets.map(preset=>({...preset,category:'none' as const,description:'Анимированный фон с параллаксом от мыши. Также доступно появление при наведении или нажатии.'})),
];

// Content effects sample the actual photo/video frame or rasterized glyph mask.
const contentHeader = `precision mediump float;
uniform sampler2D u_source;
uniform vec2 u_resolution, u_sourceSize, u_mouse, u_clickPosition;
uniform float u_click, u_clickAge, u_radius;
uniform vec3 u_clicks[12];
uniform float u_clickCount;
uniform vec3 u_colorA, u_colorB;
uniform float u_time, u_scale, u_size, u_intensity, u_strength, u_hover, u_amount;
vec4 sampleSource(vec2 uv) {
  float sourceRatio=u_sourceSize.x/max(u_sourceSize.y,1.0);
  float viewRatio=u_resolution.x/u_resolution.y;
  vec2 cover=vec2(min(1.0,viewRatio/sourceRatio),min(1.0,sourceRatio/viewRatio));
  return texture2D(u_source,clamp((uv-0.5)*cover+0.5,0.001,0.999));
}
void main(){
  vec2 uv=gl_FragCoord.xy/u_resolution;
  float t=u_time;
  float strength=u_strength;
  vec4 base=sampleSource(uv);
  vec4 effect=base;
`;
const mediaDefinitions = [
  ['media-water-ripple','Водная рябь','#a5f3fc','#196689','none',`
    vec2 aspect=vec2(u_resolution.x/u_resolution.y,1.0);
    vec2 d=(uv-0.5)*aspect; float r=length(d);
    float phase=r*48.0*u_scale*100.0/u_size-t*3.0;
    float wave=sin(phase)*0.018*strength/(1.0+r*3.0);
    vec2 offset=normalize(d+vec2(0.0001))*wave/aspect;
    effect=sampleSource(uv+offset);
    effect.rgb+=u_colorA*pow(0.5+0.5*cos(phase),12.0)*0.12*strength;`],
  ['media-light-ripple','Световая рябь на медиа','#c9faff','#4d8dff','click',`
    vec2 aspect=vec2(u_resolution.x/u_resolution.y,1.0);
    vec2 totalOffset=vec2(0.0);vec3 totalLight=vec3(0.0);
    for(int i=0;i<12;i++){if(float(i)<u_clickCount){
      float age=u_clicks[i].z;
      vec2 d=(uv-u_clicks[i].xy)*aspect;float r=length(d);
      float front=age*0.42;
      float phase=(r-front)*70.0*u_scale*100.0/u_size;
      float envelope=exp(-pow((r-front)/max(u_radius,0.04),2.0))*max(0.0,1.0-age/1.8);
      totalOffset+=normalize(d+vec2(0.0001))*sin(phase)*envelope*0.027*strength/aspect;
      float light=pow(0.5+0.5*cos(phase),16.0)*envelope;
      totalLight+=mix(u_colorB,u_colorA,light)*light*0.65*strength;
    }}
    effect=sampleSource(uv+clamp(totalOffset,vec2(-0.15),vec2(0.15)));
    effect.rgb+=totalLight;`],
  ['media-pointer-ripple','Волны от курсора','#a5ffe3','#27b8ee','pointer',`
    vec2 aspect=vec2(u_resolution.x/u_resolution.y,1.0);
    vec2 d=(uv-u_mouse)*aspect; float r=length(d);
    float phase=r*58.0*u_scale*100.0/u_size-t*4.0;
    float field=exp(-r/max(u_radius*2.0,0.04))*u_hover;
    effect=sampleSource(uv+normalize(d+vec2(0.0001))*sin(phase)*0.024*field*strength/aspect);
    effect.rgb+=u_colorA*pow(0.5+0.5*cos(phase),12.0)*field*0.25*strength;`],

  ['media-liquid','Жидкая линза','#41e3ee','#a78bfa','pointer',`
    vec2 d=uv-u_mouse; d.x*=u_resolution.x/u_resolution.y;
    float r=length(d); float lens=max(0.03,0.12*u_size/100.0/u_scale); float field=exp(-r*r/lens)*u_hover;
    vec2 offset=vec2(sin(uv.y*24.0+t*2.0),cos(uv.x*20.0-t*1.5))*0.035*field*strength;
    effect=sampleSource(uv+offset);
    effect.rgb+=u_colorA*field*0.10*strength;`],
  ['media-prism','Хроматическая призма','#ff447c','#42deff','pointer',`
    vec2 d=(uv-u_mouse); float falloff=exp(-dot(d,d)*6.0);
    vec2 offset=(d+vec2(sin(t)*0.2,0.0))*0.035*strength*(u_size/100.0)/u_scale*(0.4+falloff*u_hover);
    effect.r=sampleSource(uv+offset).r; effect.b=sampleSource(uv-offset).b;`],
  ['media-pixels','Пиксельное раскрытие','#ffb54d','#f54291','hover',`
    float cell=max(2.0,26.0*(u_size/100.0)/u_scale*strength);
    vec2 grid=u_resolution/cell;
    vec2 pixel=(floor(uv*grid)+0.5)/grid;
    effect=sampleSource(pixel);`],
  ['media-duotone','Дуотон','#f97316','#3b0764','none',`
    float l=dot(base.rgb,vec3(0.2126,0.7152,0.0722));
    effect.rgb=mix(u_colorB,u_colorA,smoothstep(0.05,0.95,l));`],
  ['media-halftone','Печатный растр','#ffca70','#171329','none',`
    float cell=max(3.0,9.0*u_size/100.0/u_scale*strength);
    vec2 grid=u_resolution/cell;
    vec4 ink=sampleSource((floor(uv*grid)+0.5)/grid);
    float l=dot(ink.rgb,vec3(0.2126,0.7152,0.0722));
    float dotMask=1.0-smoothstep(0.45*sqrt(1.0-l),0.45*sqrt(1.0-l)+0.06,length(fract(uv*grid)-0.5));
    effect.rgb=mix(u_colorA,u_colorB,dotMask);`],
  ['media-vhs','Аналоговое видео','#60efff','#ff4e91','none',`
    float band=step(0.94,sin(uv.y*36.0+t*4.0));
    float shift=(sin(uv.y*170.0+t*5.0)*0.002+band*0.012)*strength;
    effect.r=sampleSource(uv+vec2(shift+0.006*u_size/100.0,0.0)).r;
    effect.g=sampleSource(uv+vec2(shift,0.0)).g;
    effect.b=sampleSource(uv+vec2(shift-0.006*u_size/100.0,0.0)).b;
    effect.rgb*=0.82+0.18*sin(gl_FragCoord.y*1.8);
    float grain=fract(sin(dot(uv+fract(t),vec2(12.9898,78.233)))*43758.5453);
    effect.rgb+=(grain-0.5)*0.09;`],
] as const;
const textDefinitions = [
  ['text-sheen','Бегущий блик','#fff3b0','#f97316','none',`
    float sweep=pow(max(0.0,1.0-abs(fract((uv.x*0.6-uv.y*0.25)*u_scale*100.0/u_size-t*0.22)*2.0-1.0)),9.0);
    effect.rgb=mix(u_colorB,u_colorA,sweep)*u_intensity;
    effect.a=base.a;`],
  ['text-chrome','Хромовые буквы','#edfaff','#5363b1','none',`
    float bands=0.5+0.5*sin(uv.y*22.0*u_scale*100.0/u_size+sin(uv.x*5.0+t)*2.0);
    float shine=pow(bands,10.0);
    effect.rgb=(mix(u_colorB,u_colorA,smoothstep(0.3,0.65,bands))+shine*0.7)*u_intensity;
    effect.a=base.a;`],
  ['text-hologram','Голографический текст','#5bffcc','#d946ef','pointer',`
    float v=0.5+0.5*sin((uv.x+uv.y)*9.0*u_scale*100.0/u_size+t+u_mouse.x*u_hover*6.0);
    effect.rgb=mix(u_colorA,u_colorB,v)*u_intensity;
    effect.rgb+=vec3(0.2)*pow(0.5+0.5*sin(uv.y*38.0-t*2.0),12.0);
    effect.a=base.a;`],
  ['text-neon','Неоновые буквы','#30f5ff','#d72dff','hover',`
    float flicker=0.87+0.13*sin(t*3.0);
    effect.rgb=mix(u_colorA,u_colorB,0.5+0.5*sin(uv.x*5.0*u_scale*100.0/u_size-t))*flicker*u_intensity*1.25;
    effect.a=base.a;`],
] as const;
const contentPresets: ShaderPreset[] = [...mediaDefinitions.map(d=>({d,target:'media' as const})),...textDefinitions.map(d=>({d,target:'text' as const}))].map(({d,target})=>({
  id:d[0],category:target,description:'',config:{name:d[1],target,colorA:d[2],colorB:d[3],interaction:d[4],
    fragment:contentHeader+d[5]+`\n gl_FragColor=mix(base,effect,clamp(u_amount,0.0,1.0));\n}`,
    speed:1,scale:1,size:100,intensity:1.2,opacity:1,response:0.12,radius:0.28,strength:1.4,backgroundOpacity:0},
}));
const objectDefinitions = [
  ['object-holo','Голографическая фольга','#35f4d0','#fc4bef',`float v=0.5+0.5*sin((uv.x+uv.y)*10.0+t+u_mouse.x*u_hover*8.0); vec3 c=mix(u_colorA,u_colorB,v); c+=pow(0.5+0.5*cos(uv.y*30.0+uv.x*12.0-t),14.0)*0.65;`],
  ['object-pearl','Жемчужный перелив','#ffb4d9','#8fdfff',`float v=sin(p.x*5.0+sin(p.y*8.0+t))*cos(p.y*4.0-t); vec3 c=mix(u_colorA,u_colorB,v*0.5+0.5); c+=pow(max(0.0,sin(v*5.0+t)),12.0)*0.6;`],
  ['object-brushed','Шлифованный металл','#dcefff','#293a58',`float grain=fract(sin(dot(floor(uv*u_resolution),vec2(12.9898,78.233)))*43758.5453); float stripe=pow(0.5+0.5*sin(uv.y*15.0+t*0.6+u_mouse.x*u_hover*3.0),5.0); vec3 c=mix(u_colorB,u_colorA,stripe)+grain*0.06;`],
] as const;
const objectPresets: ShaderPreset[]=objectDefinitions.map(([id,name,colorA,colorB,body])=>({id,category:'object',description:'',config:{
  target:'object',name,colorA,colorB,fragment:header+body+'\n gl_FragColor=vec4(c*u_intensity,1.0);}',
  interaction:'pointer',speed:1,scale:1,size:100,intensity:1,opacity:1,response:0.15,strength:1.3,backgroundColor:'#111827',backgroundOpacity:1,
}}));
export const SHADER_PRESETS: ShaderPreset[]=[...surfacePresets,...objectPresets,...contentPresets];

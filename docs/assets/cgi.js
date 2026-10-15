/* Original real-time service illustrations. Native WebGL, no remote libraries. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (n,a=0,b=1) => Math.max(a,Math.min(b,n));
  const smooth = n => { n=clamp(n); return n*n*(3-2*n); };
  const lerp = (a,b,t) => a+(b-a)*t;
  const norm = v => { const d=Math.hypot(...v)||1; return v.map(n=>n/d); };
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot = (a,b) => a.reduce((s,n,i)=>s+n*b[i],0);
  const color = hex => [1,3,5].map(i=>Math.pow(parseInt(hex.slice(i,i+2),16)/255,2.2));
  const identity = () => [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  function multiply(a,b) { const out=Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out; }
  function model(p,s,r) {
    const [x,y,z]=r, cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);
    const rx=[1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1];
    const ry=[cy,0,-sy,0,0,1,0,0,sy,0,cy,0,0,0,0,1];
    const rz=[cz,sz,0,0,-sz,cz,0,0,0,0,1,0,0,0,0,1];
    const rotation=multiply(ry,multiply(rz,rx)),m=rotation.slice();
    for(let c=0;c<3;c++)for(let row=0;row<3;row++)m[c*4+row]*=s[c];
    m[12]=p[0];m[13]=p[1];m[14]=p[2];
    const normal=[];for(let c=0;c<3;c++)for(let row=0;row<3;row++)normal.push(rotation[c*4+row]/Math.max(.0001,s[c]));
    return {m,normal};
  }
  function lookAt(eye,target) {
    const z=norm(eye.map((v,i)=>v-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);
    return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];
  }
  function projection(aspect) { const f=1/Math.tan(35*Math.PI/360),n=.5,far=40;return [f/aspect,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0]; }
  const vertex = `precision highp float;attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUV;
    uniform mat4 uModel;uniform mat4 uVP;uniform mat3 uNormal;
    varying mediump vec3 vPosition;varying mediump vec3 vNormal;varying mediump vec2 vUV;
    void main(){vec4 p=uModel*vec4(aPosition,1.0);vPosition=p.xyz;vNormal=normalize(uNormal*aNormal);vUV=aUV;gl_Position=uVP*p;}`;
  const fragment = `precision mediump float;varying vec3 vPosition;varying vec3 vNormal;varying vec2 vUV;
    uniform vec3 uColor;uniform vec3 uEye;uniform float uMetal;uniform float uAlpha;
    uniform float uTextureOn;uniform sampler2D uTexture;
    void main(){vec3 n=normalize(vNormal),l=normalize(vec3(-0.45,0.85,0.75)),v=normalize(uEye-vPosition);
      float diffuse=max(dot(n,l),0.0);float rim=pow(1.0-max(dot(n,v),0.0),3.0);
      float spec=pow(max(dot(n,normalize(l+v)),0.0),mix(38.0,130.0,uMetal));
      vec3 c=uColor*(0.32+0.68*diffuse)+vec3(0.72,0.84,1.0)*spec*(0.22+uMetal*0.78)+vec3(0.22,0.38,0.54)*rim*uMetal*0.25;
      float alpha=uAlpha;
      if(uTextureOn>0.5){vec4 tex=texture2D(uTexture,vUV);c=pow(tex.rgb,vec3(2.2));alpha*=tex.a;}
      gl_FragColor=vec4(pow(max(c,vec3(0.0)),vec3(1.0/2.2))*alpha,alpha);}`;
  function geometry(kind) {
    const data=[];
    const put=(p,n,uv=[0,0])=>data.push(...p,...n,...uv);
    const quad=(p,n,uv=[[0,0],[1,0],[1,1],[0,1]])=>{for(const i of [0,1,2,0,2,3])put(p[i],Array.isArray(n[0])?n[i]:n,uv[i]);};
    if(kind==='box') {
      const faces=[[0,1,1,2],[0,-1,1,2],[1,1,0,2],[1,-1,0,2],[2,1,0,1],[2,-1,0,1]],steps=6,r=.075;
      for(const [axis,sign,u,v] of faces)for(let iy=0;iy<steps;iy++)for(let ix=0;ix<steps;ix++) {
        const positions=[],normals=[];
        for(const [xx,yy] of [[ix,iy],[ix+1,iy],[ix+1,iy+1],[ix,iy+1]]) {
          const p=[0,0,0];p[axis]=sign*.5;p[u]=xx/steps-.5;p[v]=yy/steps-.5;
          const q=p.map(n=>clamp(n,-.5+r,.5-r)),normal=norm(p.map((n,i)=>n-q[i]));
          positions.push(q.map((n,i)=>n+normal[i]*r));normals.push(normal);
        }
        quad(positions,normals);
      }
    } else if(kind==='cylinder') {
      for(let i=0;i<32;i++) {
        const a=i/32*TAU,b=(i+1)/32*TAU,p=[[Math.cos(a),-.5,Math.sin(a)],[Math.cos(b),-.5,Math.sin(b)],[Math.cos(b),.5,Math.sin(b)],[Math.cos(a),.5,Math.sin(a)]];
        quad(p,p.map(q=>[q[0],0,q[2]]));
        for(const sign of [-1,1]) {put([0,.5*sign,0],[0,sign,0]);put([Math.cos(a),.5*sign,Math.sin(a)],[0,sign,0]);put([Math.cos(b),.5*sign,Math.sin(b)],[0,sign,0]);}
      }
    } else if(kind==='sphere') {
      for(let y=0;y<12;y++)for(let x=0;x<20;x++) {
        const p=[];for(const [xx,yy] of [[x,y],[x+1,y],[x+1,y+1],[x,y+1]]) {const a=xx/20*TAU,b=yy/12*Math.PI;p.push([Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)]);}
        quad(p,p);
      }
    } else if(kind==='torus') {
      for(let y=0;y<8;y++)for(let x=0;x<32;x++) {
        const p=[],n=[];for(const [xx,yy] of [[x,y],[x+1,y],[x+1,y+1],[x,y+1]]) {const a=xx/32*TAU,b=yy/8*TAU;p.push([(1+.19*Math.cos(b))*Math.cos(a),.19*Math.sin(b),(1+.19*Math.cos(b))*Math.sin(a)]);n.push([Math.cos(b)*Math.cos(a),Math.sin(b),Math.cos(b)*Math.sin(a)]);}
        quad(p,n);
      }
    } else quad([[-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0]],[0,0,1]);
    return new Float32Array(data);
  }
  class Stage {
    constructor(canvas) {
      this.canvas=canvas;this.wrap=canvas.closest('.cgi-stage');this.mode=Number(canvas.dataset.mode)||0;this.previous=this.mode;this.changed=-100;this.sceneStarted=0;this.previousStart=0;this.opacity=1;
      this.paused=document.body.classList.contains('motion-paused');this.visible=true;this.pointer=[0,0];this.target=[0,0];this.time=0;this.last=0;this.frame=0;this.destroyed=false;
      try {
        const gl=this.gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,powerPreference:'low-power'});
        if(!gl)throw new Error('WebGL unavailable');
        const compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
        this.program=gl.createProgram();gl.attachShader(this.program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(this.program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(this.program);
        if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));
        gl.useProgram(this.program);this.uniforms={};for(const key of ['Model','VP','Normal','Color','Eye','Metal','Alpha','TextureOn','Texture'])this.uniforms[key]=gl.getUniformLocation(this.program,'u'+key);
        this.attributes=['Position','Normal','UV'].map(k=>gl.getAttribLocation(this.program,'a'+k));this.meshes={};
        for(const kind of ['box','cylinder','sphere','torus','plane']){const data=geometry(kind),buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);this.meshes[kind]={buffer,count:data.length/8};}
        gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
        this.shadow=this.makeTexture('shadow');this.decal=this.makeTexture('decal');
        this.wrap.classList.add('cgi-ready');
      } catch(error) { this.program=null;this.wrap.classList.add('cgi-unavailable');canvas.dataset.renderStatus='fallback';return; }
      canvas.dataset.renderStatus='webgl';
      this.observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;if(this.visible)this.start();else this.stop();},{rootMargin:'100px'}):null;this.observer?.observe(canvas);
      this.resizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(()=>{this.resize();this.draw(this.time);}):null;this.resizeObserver?.observe(canvas);
      this.resize();canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const b=canvas.getBoundingClientRect();this.target=[(e.clientX-b.left)/b.width-.5,(e.clientY-b.top)/b.height-.5];if(!this.paused)this.start();});
      canvas.addEventListener('pointerleave',()=>{this.target=[0,0];});
      canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.contextLost=true;this.stop();this.wrap.classList.add('cgi-unavailable');canvas.dataset.renderStatus='fallback';});
      this.time=this.paused?4.2:0;this.draw(this.time);this.start();
    }
    makeTexture(kind) {
      const gl=this.gl,c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');
      if(kind==='shadow'){const grad=ctx.createRadialGradient(256,128,0,256,128,125);grad.addColorStop(0,'rgba(8,29,60,.35)');grad.addColorStop(.5,'rgba(8,29,60,.15)');grad.addColorStop(1,'rgba(8,29,60,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,512,256);}
      else{ctx.fillStyle='#084b92';ctx.font='bold 155px Georgia,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('RT',256,107);ctx.font='600 34px Arial,sans-serif';ctx.fillText('R. TASHOLLI',256,210);}
      const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return texture;
    }
    resize() {if(!this.program||this.contextLost)return;const b=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.75);const w=Math.max(1,Math.round(b.width*dpr)),h=Math.max(1,Math.round(b.height*dpr));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}this.gl.viewport(0,0,w,h);}
    setMode(mode) {mode=clamp(Number(mode)||0,0,2);if(mode===this.mode)return;this.previous=this.mode;this.previousStart=this.sceneStarted;this.mode=mode;this.changed=this.time;this.sceneStarted=this.time;this.wrap.dataset.active=String(mode);this.wrap.setAttribute('aria-label','Animierte Illustration: '+['Fensterreinigung und Staubsauger','Transporter und Umzugskartons','Rasenmäher und Heckenschere'][mode]);if(!this.program||this.contextLost)return;if(this.paused){this.changed=this.time-1;this.sceneStarted=this.time-4.2;this.draw(this.time);}else this.start();}
    setPaused(paused) {this.paused=paused;if(!this.program||this.contextLost)return;if(paused){this.stop();this.draw(this.time);}else this.start();}
    start() {if(!this.program||this.contextLost||this.frame||this.paused||!this.visible||document.hidden)return;this.last=performance.now();this.frame=requestAnimationFrame(t=>this.tick(t));}
    stop() {if(this.frame)cancelAnimationFrame(this.frame);this.frame=0;}
    tick(now) {this.frame=0;if(this.paused||!this.visible||document.hidden)return;const delta=Math.min((now-this.last)/1000,.05);this.last=now;this.time+=delta;for(let i=0;i<2;i++)this.pointer[i]=lerp(this.pointer[i],this.target[i],.045);this.draw(this.time);this.frame=requestAnimationFrame(t=>this.tick(t));}
    object(kind,p,s,c='#ffffff',r=[0,0,0],metal=.2,alpha=1,texture=null) {
      const gl=this.gl,u=this.uniforms,mesh=this.meshes[kind],m=model(p,s,r);gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);
      for(let i=0;i<3;i++){gl.enableVertexAttribArray(this.attributes[i]);gl.vertexAttribPointer(this.attributes[i],i===2?2:3,gl.FLOAT,false,32,i===0?0:i===1?12:24);}
      gl.uniformMatrix4fv(u.Model,false,m.m);gl.uniformMatrix3fv(u.Normal,false,m.normal);gl.uniform3fv(u.Color,color(c));gl.uniform1f(u.Metal,metal);gl.uniform1f(u.Alpha,alpha*this.opacity);
      gl.uniform1f(u.TextureOn,texture?1:0);if(texture){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(u.Texture,0);}
      gl.drawArrays(gl.TRIANGLES,0,mesh.count);
    }
    tube(a,b,r,color='#b8c5d4',metal=.8) {const d=b.map((v,i)=>v-a[i]),length=Math.hypot(...d),angle=Math.acos(clamp(d[1]/length,-1,1));const ry=Math.atan2(d[0],d[2]);this.object('cylinder',a.map((v,i)=>(v+b[i])/2),[r,length,r],color,[angle,ry,0],metal);}
    floor(x=0,z=0,width=5,depth=3) {this.gl.depthMask(false);this.object('plane',[x,.008,z],[width,depth,1],'#ffffff',[-Math.PI/2,0,0],0,1,this.shadow);this.gl.depthMask(true);}
    draw(t) {
      const gl=this.gl;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);
      const mode=this.mode,eye=[4.9+this.pointer[0]*.6,3.65-this.pointer[1]*.45,7.5],target=[0,1.2,0];
      gl.uniformMatrix4fv(this.uniforms.VP,false,multiply(projection(this.canvas.width/this.canvas.height),lookAt(eye,target)));gl.uniform3fv(this.uniforms.Eye,eye);
      const elapsed=t-this.changed,mix=this.paused?1:smooth(elapsed/.9);
      if(mix<1){this.opacity=1-mix;this.scene(this.previous,t-this.previousStart);gl.clear(gl.DEPTH_BUFFER_BIT);}
      this.opacity=mix;this.scene(mode,t-this.sceneStarted);this.opacity=1;
    }
    scene(mode,t) {if(mode===0)this.clean(t);else if(mode===1)this.move(t);else this.garden(t);}
    clean(t) {
      const cycle=t%8,progress=smooth(clamp(cycle/5.2)),wipeX=-1.75+3.25*progress;
      this.floor(0,.45,5.6,3.5);
      const frame='#edf4ff';
      for(const x of [-1.9,1.5])this.object('box',[x,1.65,0],[.1,3,.18],frame,[0,0,0],.75);
      for(const y of [.2,3.1])this.object('box',[-.2,y,0],[3.5,.1,.18],frame,[0,0,0],.75);
      this.object('box',[-.2,1.65,-.025],[3.28,2.8,.065],'#94c3dc',[0,0,0],.8,.26);
      this.object('box',[-.2,.1,0],[3.75,.18,.5],'#e0e9f4',[0,0,0],.6);
      for(let i=0;i<24;i++){const x=-1.65+(i%6)*.51,y=.5+Math.floor(i/6)*.6;if(x>wipeX+.04)this.object('sphere',[x,y,.046],[.08+.035*Math.sin(i),.13,.009],'#b0afb5',[0,0,0],0,.18);}
      const active=cycle<5.8?1:1-smooth((cycle-5.8)/.7);
      this.object('box',[wipeX,1.68,.18],[.12,2.55,.12],'#233b52',[0,0,0],.4,active);
      this.object('box',[wipeX-.025,1.68,.25],[.045,2.52,.11],'#080f18',[0,0,0],.1,active);
      this.object('box',[wipeX+.3,1.68,.37],[.57,.105,.16],'#087ec6',[0,0,0],.5,active);
      this.tube([wipeX+.45,1.68,.4],[wipeX+.85,1.0,.73],.038);
      for(let i=0;i<2;i++){const shine=((t*.33+i*.5)%1),x=-1.7+shine*3.2;this.object('box',[x,1.65,.07],[.025,2.72,.01],'#ffffff',[0,0,-.22],.8,Math.sin(shine*Math.PI)*.6);}
      for(const [x,y] of [[-1.9,3.1],[1.5,2.5]]) {const a=.25+.75*(.5+.5*Math.sin(t*1.3+x))**3;this.object('box',[x,y,.12],[.3,.025,.025],'#d7f6ff',[0,0,.3],.95,a);this.object('box',[x,y,.12],[.025,.3,.025],'#d7f6ff',[0,0,.3],.95,a);}
      const vx=Math.sin(t*.75)*1.1;
      this.object('cylinder',[vx+.55,.43,1.0],[.34,.63,.34],'#0967b5',[0,0,0],.5);
      this.object('sphere',[vx+.55,.75,1],[.34,.14,.34],'#a7c8e6',[0,0,0],.7);
      for(const z of [.7,1.3])this.object('cylinder',[vx+.55,.18,z],[.14,.1,.14],'#13263b',[Math.PI/2,0,0],.1);
      this.object('box',[vx-.55,.08,1.9],[.88,.14,.32],'#0b518a',[0,0,-.04],.7);
      this.tube([vx-.55,.17,1.85],[vx-.2,1.15,1.35],.04);
      this.tube([vx-.2,1.15,1.35],[vx+.25,1.03,1.1],.04,'#087bc4',.4);
      const a=[vx+.25,1.03,1.1],b=[vx+.6,.5,1.15];for(let i=0;i<9;i++){const p=i/9,q=(i+1)/9;this.tube([lerp(a[0],b[0],p)+.24*Math.sin(p*Math.PI),lerp(a[1],b[1],p),a[2]],[lerp(a[0],b[0],q)+.24*Math.sin(q*Math.PI),lerp(a[1],b[1],q),b[2]],.05,'#152c43',.15);}
      for(let i=0;i<14;i++){const x=-1.4+i*.2;if(x>vx-.1)this.object('sphere',[x,.025,1.85],[.022,.02,.025],'#b9aa86',[0,0,0],0);}
    }
    carton(p,size=.6,rotation=0) {
      this.object('box',p,[size,size,size],'#b18b5e',[0,rotation,0],.06);
      this.object('box',[p[0],p[1]+size*.505,p[2]],[.085,.009,size*.95],'#dfc49f',[0,rotation,0],.02);
      this.object('box',[p[0],p[1],p[2]+size*.501],[size*.26,.045,.007],'#745438',[0,0,0],0);
    }
    move(t) {
      const cycle=t%12,drive=cycle<2?lerp(-5,0,smooth(cycle/2)):cycle>9.7?lerp(0,5,smooth((cycle-9.7)/2.3)):0;
      this.floor(drive,.2,6,3.2);const x=drive;
      this.object('box',[x-.45,.66,0],[3.45,.28,1.76],'#176cad',[0,0,0],.65);
      this.object('box',[x-.58,2.4,0],[3.2,.16,1.78],'#ecf3fa',[0,0,0],.6);
      this.object('box',[x-.58,1.53,-.82],[3.2,1.67,.13],'#edf4fa',[0,0,0],.5);
      this.object('box',[x-2.12,1.54,0],[.12,1.72,1.77],'#edf4fa',[0,0,0],.5);
      this.object('box',[x+.9,1.54,0],[.17,1.7,1.77],'#edf4fa',[0,0,0],.5);
      const open=smooth((cycle-2)/.8)*(1-smooth((cycle-8.8)/.7));
      this.object('box',[x-.55-open*.83,1.53,.84],[1.65,1.65,.14],'#f6f9fc',[0,0,0],.6);
      this.object('box',[x-.65-open*.83,.91,.93],[1.7,.22,.02],'#087bcb',[0,0,0],.6);
      this.object('box',[x+1.42,1.36,0],[1.08,1.55,1.69],'#dcebf5',[0,0,0],.7);
      this.object('box',[x+2.01,1.8,0],[.022,.63,1.4],'#183f57',[0,0,-.05],.85);
      this.object('box',[x+1.35,1.88,.879],[.77,.51,.025],'#193f59',[0,0,0],.85);
      this.object('box',[x+1.42,.83,.883],[.8,.19,.025],'#087fc9',[0,0,0],.6);
      this.object('plane',[x+1.43,1.26,.902],[.58,.3,1],'#ffffff',[0,0,0],0,1,this.decal);
      this.object('box',[x+1.83,1.25,1.0],[.12,.12,.23],'#174c71',[0,0,0],.7);
      this.object('box',[x+2,.6,0],[.25,.2,1.8],'#17304b',[0,0,0],.55);
      for(const z of [-.54,.54])this.object('box',[x+1.97,.94,z],[.045,.15,.28],'#d6f3ff',[0,0,0],.95);
      for(const xx of [-1.35,1.38])for(const z of [-.91,.91]) {
        this.object('cylinder',[x+xx,.46,z],[.44,.18,.44],'#162230',[Math.PI/2,0,0],.05);
        this.object('cylinder',[x+xx,.46,z+Math.sign(z)*.11],[.27,.018,.27],'#adbed1',[Math.PI/2,0,0],.85);
        for(let i=0;i<5;i++){const a=i/5*TAU+drive*2;this.object('box',[x+xx+Math.sin(a)*.14,.46+Math.cos(a)*.14,z+Math.sign(z)*.13],[.06,.25,.024],'#d1dfeb',[0,0,-a],.75);}
      }
      this.carton([x-.8,1.06,.02],.58);this.carton([x-.15,1.08,-.1],.62);this.carton([x-.8,1.66,.02],.54);
      if(cycle>2&&cycle<9) {
        const p=(cycle-2)%2.1/2.1,s=smooth(p),lift=Math.sin(Math.PI*p)*.85;
        const position=[lerp(-2.85,x-.25,s),lerp(.32,1.12,s)+lift,lerp(2.0,.12,s)];this.floor(position[0],position[2],1.2,.8);this.carton(position,.61,Math.sin(p*Math.PI)*.18);
        this.carton([-2.75,.28,1.05],.53);
      }
    }
    garden(t) {
      const p=(t%10)/10,mx=lerp(-2.15,2.15,smooth(p)),hx=Math.sin(t*.6)*1.0;
      this.floor(0,.35,6,4.1);
      this.object('box',[0,.06,.7],[4.8,.13,3.25],'#79b568',[0,0,0],.04);
      for(let i=0;i<17;i++){const x=-2.25+i*.27,cut=x<mx;this.object('box',[x,.13,1.4],[.26,.025,.9],cut?'#a3cf85':'#609f52',[0,0,0],0);if(!cut)for(let j=0;j<2;j++)this.object('box',[x+.05*j,.24,1.2+.3*j],[.028,.19,.035],'#518b43',[0,0,.15*Math.sin(i)],0);}
      this.object('box',[0,.75,-.4],[4.3,1.28,.85],'#296640',[0,0,0],.06);
      for(let i=0;i<13;i++){const x=-1.9+i*.31,y=1.33+.05*Math.sin(i*4);this.object('sphere',[x,y,-.4],[.26,.17,.36],i%2?'#438750':'#367749',[0,0,0],.03);if(x>hx+.3)this.object('sphere',[x,y+.2,-.4],[.11,.15,.12],'#54955e',[0,0,0],.02);}
      this.object('box',[mx,.37,1.45],[.95,.35,.87],'#066dbc',[0,0,0],.65);
      this.object('box',[mx-.08,.59,1.45],[.6,.25,.59],'#e5edf5',[0,0,0],.6);
      for(const xx of [-.39,.39])for(const z of [1.0,1.9]){this.object('cylinder',[mx+xx,.21,z],[.21,.12,.21],'#122734',[Math.PI/2,0,0],.1);this.object('cylinder',[mx+xx,.21,z+.065],[.1,.008,.1],'#a1c0d1',[Math.PI/2,0,0],.7);}
      for(const z of [1.1,1.8]){this.tube([mx-.37,.42,z],[mx-.95,1.15,z],.027);this.tube([mx-.95,1.15,z],[mx-1.12,1.34,z],.027,'#183c52',.35);}
      this.tube([mx-1.12,1.34,1.1],[mx-1.12,1.34,1.8],.043,'#0d2c41',.2);
      this.object('box',[hx-.68,1.75,-.12],[.65,.3,.4],'#067bbf',[0,0,.06],.5);
      this.object('torus',[hx-.81,1.95,-.12],[.23,.2,.21],'#143747',[Math.PI/2,0,0],.25);
      this.object('box',[hx-.27,1.74,-.12],[.12,.42,.48],'#133041',[0,0,0],.35);
      this.object('box',[hx+.45,1.73,-.12],[1.4,.07,.15],'#c3d4dc',[0,0,0],.88);
      for(let i=0;i<10;i++)for(const side of [-1,1])this.object('box',[hx-.11+i*.13+Math.sin(t*15)*.017,1.73,-.12+side*.105],[.067,.046,.12],'#d5e6ee',[0,0,side*.12],.88);
      for(let i=0;i<9;i++){const f=(t*.7+i/9)%1;this.object('sphere',[hx+.25+f*.7,1.58-f*.6,-.1+Math.sin(i*3)*f*.35],[.025,.014,.044],i%2?'#478e49':'#79b971',[0,f*4,f*7],.02,1-f);}
    }
  }
  window.RTCGI={Stage,geometry,model,multiply,projection,lookAt,smooth};
})();

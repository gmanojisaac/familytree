"use client";
import {useEffect,useRef,useState,Component,type ReactNode,type RefObject} from "react";
import {Canvas,useFrame,useThree} from "@react-three/fiber";
import {OrbitControls,Line} from "@react-three/drei";
import {Vector3,Quaternion} from "three";
import {graphLayout} from "@/lib/graph";
import type {GrovePerson} from "./explorer";
type Edge={id:string;sourceId:string;targetId:string;kind:string;subtype:string};
type Props={people:GrovePerson[];edges:Edge[];selected:string;path:string[];onSelect:(id:string)=>void;reset:number;onFallback:()=>void};
class SceneBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?this.props.fallback:this.props.children;}}
function CameraFocus({target,reset,reduced}:{target:[number,number,number];reset:number;reduced:boolean}){
 const controls=useRef<React.ComponentRef<typeof OrbitControls>>(null),destination=useRef(new Vector3()),moving=useRef(false);
 const{camera,invalidate}=useThree(),[x,y,z]=target;
 useEffect(()=>{destination.current.set(x,y,z);moving.current=true;invalidate();},[x,y,z,reset,invalidate]);
 useEffect(()=>{camera.position.set(0,5,20);invalidate();},[reset,camera,invalidate]);
 useFrame(()=>{if(controls.current&&moving.current){controls.current.target.lerp(destination.current,reduced?1:.14);controls.current.update();if(controls.current.target.distanceTo(destination.current)<.01)moving.current=false;else invalidate();}});
 return <OrbitControls ref={controls} makeDefault minDistance={8} maxDistance={32} maxPolarAngle={Math.PI*.75} enableDamping={!reduced}/>;
}
function Branch({end}:{end:[number,number,number]}){
 const start=new Vector3(0,-1.6,-2),finish=new Vector3(...end),direction=finish.clone().sub(start),mid=start.clone().add(finish).multiplyScalar(.5);
 return <mesh position={mid} quaternion={new Quaternion().setFromUnitVectors(new Vector3(0,1,0),direction.clone().normalize())}><cylinderGeometry args={[.13,.32,direction.length(),8]}/><meshStandardMaterial color="#a48460" roughness={.95}/></mesh>;
}
function Projection({people,nodes}:{people:GrovePerson[];nodes:RefObject<Map<string,HTMLButtonElement>>}){
 const{camera,size}=useThree(),layout=graphLayout(people);
 useFrame(()=>{for(const person of people){const node=nodes.current.get(person.id);if(!node)continue;const pos=new Vector3(...layout[person.id]).project(camera);node.style.left=((pos.x+1)*size.width/2)+"px";node.style.top=((-pos.y+1)*size.height/2)+"px";node.style.visibility=pos.z>1?"hidden":"visible";}});
 return null;
}
function Scene(props:Props&{reduced:boolean;nodes:RefObject<Map<string,HTMLButtonElement>>}){
 const layout=graphLayout(props.people),{gl}=useThree(),onFallback=props.onFallback;
 useEffect(()=>{const canvas=gl.domElement;function lost(e:Event){e.preventDefault();onFallback();}canvas.addEventListener("webglcontextlost",lost);return()=>canvas.removeEventListener("webglcontextlost",lost);},[gl,onFallback]);
 return <><color attach="background" args={["#edf3e7"]}/><fog attach="fog" args={["#edf3e7",28,50]}/><ambientLight intensity={1.8}/><directionalLight position={[6,12,8]} intensity={2.5} color="#fff1d0"/><pointLight position={[-7,2,4]} intensity={20} color="#e9d5ff"/>
 <mesh position={[0,-4,-2]} scale={[10,1,6]}><sphereGeometry args={[1,32,16]}/><meshStandardMaterial color="#bdd4aa" roughness={1}/></mesh>
 <mesh position={[0,-1,-2]}><cylinderGeometry args={[.45,.9,5.5,10]}/><meshStandardMaterial color="#a48460" roughness={1}/></mesh>
 {[-5,-2.8,0,2.8,5].map((x,i)=><group key={x}><Branch end={[x,3+(i%2),-2]}/><mesh position={[x,4.7+(i%2)*.6,-3]} scale={[2.5,1.8,1.5]}><icosahedronGeometry args={[1,2]}/><meshStandardMaterial color={["#a8cba6","#c5d8a8","#89bca4","#d3dfab","#a5c6b7"][i]} roughness={1}/></mesh></group>)}
 {props.edges.map(e=>{const a=layout[e.sourceId],b=layout[e.targetId],chosen=props.path.includes(e.sourceId)&&props.path.includes(e.targetId),color=chosen?"#b98527":e.kind==="PARTNER"?"#8d77a4":e.kind==="GUARDIAN"?"#267e81":"#61866b";
 const start=new Vector3(...a),finish=new Vector3(...b),direction=finish.clone().sub(start),arrow=start.clone().lerp(finish,.65);
 return <group key={e.id}><Line points={[a,b]} color={color} lineWidth={chosen?3:1.8} dashed={e.kind==="PARTNER"} dashSize={.15} gapSize={.08}/>{e.kind!=="PARTNER"&&<mesh position={arrow} quaternion={new Quaternion().setFromUnitVectors(new Vector3(0,1,0),direction.normalize())}><coneGeometry args={[.08,.22,6]}/><meshBasicMaterial color={color}/></mesh>}</group>;})}
 {props.people.map(p=><mesh key={p.id} position={layout[p.id]} onClick={()=>props.onSelect(p.id)}><sphereGeometry args={[.5,16,16]}/><meshStandardMaterial color={p.id===props.selected?"#efc76c":p.color} roughness={.6}/></mesh>)}
 <CameraFocus target={layout[props.selected]??[0,2,0]} reset={props.reset} reduced={props.reduced}/><Projection people={props.people} nodes={props.nodes}/></>;
}
export default function GroveScene(props:Props){
 const[supported,setSupported]=useState<boolean|null>(null),[reduced,setReduced]=useState(false),[active,setActive]=useState(true),nodes=useRef(new Map<string,HTMLButtonElement>());
 useEffect(()=>{const media=matchMedia("(prefers-reduced-motion: reduce)"),init=setTimeout(()=>{try{const c=document.createElement("canvas"),ctx=c.getContext("webgl2")??c.getContext("webgl");setSupported(!!ctx);ctx?.getExtension("WEBGL_lose_context")?.loseContext();}catch{setSupported(false);}setReduced(media.matches);},0);
 const change=()=>setReduced(media.matches),visibility=()=>setActive(!document.hidden);media.addEventListener("change",change);document.addEventListener("visibilitychange",visibility);return()=>{clearTimeout(init);media.removeEventListener("change",change);document.removeEventListener("visibilitychange",visibility);};},[]);
 const fallback=<div className="scene-loading"><h2>A gentler view for this device.</h2><p>3D is unavailable. Your complete family relationships are ready in the accessible 2D explorer.</p><button className="btn primary" onClick={props.onFallback}>Open 2D & list</button></div>;
 if(supported===false)return fallback;if(supported===null)return <div className="scene-loading">Preparing your grove…</div>;
 return <SceneBoundary fallback={fallback}><div className="three-scene"><Canvas camera={{position:[0,5,20],fov:45}} dpr={[1,1.5]} frameloop={active?"demand":"never"} gl={{antialias:true,preserveDrawingBuffer:true,alpha:false}}><Scene {...props} reduced={reduced} nodes={nodes}/></Canvas><div className="portrait-overlay" aria-label="3D family portrait controls">{props.people.map(p=><button key={p.id} ref={el=>{if(el)nodes.current.set(p.id,el);else nodes.current.delete(p.id);}} className={"scene-person "+(p.id===props.selected?"selected":"")} aria-label={"Select "+p.displayName} aria-pressed={p.id===props.selected} onClick={()=>props.onSelect(p.id)}><img src={p.isMinor?"/assets/svg/avatar-child.svg":"/assets/svg/avatar-adult.svg"} alt=""/><strong>{p.displayName}</strong><small>{p.deceased?"In our memories":p.isMinor?"Little branch":"Family"}</small></button>)}</div></div></SceneBoundary>;
}

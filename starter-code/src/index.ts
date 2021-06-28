import * as BABYLON from "babylonjs";
import * as environment from "./environment";
import 'babylonjs-loaders';

// Some global handles for graphics
const theCanvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new BABYLON.Engine(
    theCanvas, 
    true, 
    {
        preserveDrawingBuffer: true,
        stencil: true,
    });

if (!engine) throw "Unable to create an engine!";

// -------------------------------------------------------------------------------
// Create scene
// -------------------------------------------------------------------------------
const createScene = async function () {
    const scene = new BABYLON.Scene(engine);
    const env = await environment.setup(scene, theCanvas);
    
    return scene;
};

// -------------------------------------------------------------------------------
// Run the app
// -------------------------------------------------------------------------------
(async function () {
    const sceneToRender = await createScene();
    if(!sceneToRender) throw "Unable to create a scene!";

    window.addEventListener("resize", () => { engine.resize(); });
    engine.runRenderLoop(() => sceneToRender.render())
})()


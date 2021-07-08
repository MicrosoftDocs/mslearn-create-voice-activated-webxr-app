import * as BABYLON from "babylonjs";
import * as helper from "./helper";

export async function setup(scene: BABYLON.Scene, canvas: HTMLCanvasElement) {
    const camera = new BABYLON.ArcRotateCamera(
        "camera",
        Math.PI,
        Math.PI/3,
        8,
        new BABYLON.Vector3(0, 0, 0),
        scene
    );
    camera.attachControl(canvas, true);

    const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(0, 1, 0),
        scene
    );
    light.intensity = 3.5;

    const meshes = await importMeshes(scene);
    const background = createBackground(scene, meshes.dragonMesh as BABYLON.AbstractMesh);

    return {
        camera: camera,
        light: light,
        magicMeshes: meshes.magicMeshesRoot,
        dragonMesh: meshes.dragonMesh,
        magicCircleMesh: meshes.magicCircleMesh,
        // name the fade behavior as the object so we can call dragon.fadeIn() and magicCircle.fadeIn()
        dragon: meshes.dragonFadeBehavior, 
        magicCircle: meshes.magicCircleFadeBehavior,
        skybox: background.skybox,
        ground: background.ground
    }
}

export async function importMeshes(scene: BABYLON.Scene) {
    // Source: https://sketchfab.com/3d-models/dragon-flying-cycle-ae0831702eac462a9969ff4f8bd57710 
    const dragonMeshes = await BABYLON.SceneLoader.ImportMeshAsync("", "assets/", "green-dragon.glb", scene);
    const dragon = dragonMeshes.meshes[0];
    helper.scaleFromPivot(dragon, new BABYLON.Vector3(0, 0, 0), 0.2, 0.2, 0.2);
    dragon.position.y += 4;

    const magicCircleMeshes = await BABYLON.SceneLoader.ImportMeshAsync("", "https://models.babylonjs.com/TrailMeshSpell/", "spellDisk.glb", scene);
    const magicCircle = magicCircleMeshes.meshes[0];
    helper.scaleFromPivot(magicCircle, new BABYLON.Vector3(0, 0, 0), 2, 2, 2);
    magicCircle.position.y += 1;
    magicCircle.position.z -= 1;

    const magicRoot = new BABYLON.TransformNode("magicRoot");
    dragon.parent = magicRoot;
    magicCircle.parent = magicRoot;
    helper.scaleFromPivot(magicRoot, new BABYLON.Vector3(0, 0, 0), 0.3, 0.3, 0.3);

    const dragonFade = new BABYLON.FadeInOutBehavior();
    dragonFade.fadeInTime = 500;
    helper.addFadeBehavior(dragon, dragonFade);

    const magicFade = new BABYLON.FadeInOutBehavior();
    magicFade.fadeInTime = 300;
    helper.addFadeBehavior(magicCircle, magicFade);

    return {
        dragonMesh: dragon,
        magicCircleMesh: magicCircle,
        magicMeshesRoot: magicRoot,
        dragonFadeBehavior: dragonFade,
        magicCircleFadeBehavior: magicFade
    }
}

export function createBackground(scene: BABYLON.Scene, meshToRender: BABYLON.AbstractMesh) {
    const skybox = BABYLON.Mesh.CreateBox("BackgroundSkybox", 500, scene, undefined, BABYLON.Mesh.BACKSIDE);
    const skyboxMaterial = new BABYLON.BackgroundMaterial("skyboxMaterial", scene);
    var files = [
        "assets/space_left.jpg",
        "assets/space_up.jpg",
        "assets/space_front.jpg",
        "assets/space_right.jpg",
        "assets/space_down.jpg",
        "assets/space_back.jpg",
    ];
    skyboxMaterial.reflectionTexture = BABYLON.CubeTexture.CreateFromImages(files, scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skybox.material = skyboxMaterial;

    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 400, height: 400});
    const groundMaterial = new BABYLON.BackgroundMaterial("groundMaterial", scene);
    
    const mirror = new BABYLON.MirrorTexture("mirror", 512, scene);
    mirror.mirrorPlane = new BABYLON.Plane(0, -1, 0, 0);
    mirror.renderList = [meshToRender, ...(meshToRender.getChildMeshes()), skybox];

    groundMaterial.reflectionTexture = mirror;
    ground.material = groundMaterial;

    return {
        skybox: skybox,
        ground: ground
    }
}
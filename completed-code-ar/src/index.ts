import { 
    SpeechConfig, 
    AudioConfig, 
    Recognizer, 
    SpeechRecognizer, 
    PhraseListGrammar, 
    SpeechRecognitionEventArgs, 
    SpeechRecognitionCanceledEventArgs, 
    ResultReason, 
    CancellationReason, 
} from 'microsoft-cognitiveservices-speech-sdk';
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

    const SUBSCRIPTION_KEY = "YOUR_AZURE_SPEECH_SUBSCRIPTION_KEY";
    const LOCATION = "YOUR_AZURE_SPEECH_INSTANCE_LOCATION";

    const speechConfig = SpeechConfig.fromSubscription(SUBSCRIPTION_KEY, LOCATION);
    speechConfig.speechRecognitionLanguage = 'en-US';
    const audioConfig = AudioConfig.fromDefaultMicrophoneInput();

    const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

    const spell = "go dragon";
    const phraseList = PhraseListGrammar.fromRecognizer(recognizer);
    phraseList.addPhrase(spell);

    recognizer.canceled = (s: Recognizer, e: SpeechRecognitionCanceledEventArgs) => {
        if (e.reason == CancellationReason.Error) {
            console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
            console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
        }
    
        recognizer.stopContinuousRecognitionAsync();
    };

    const xr = await scene.createDefaultXRExperienceAsync({
        uiOptions: {
            sessionMode: "immersive-ar",
        },
    });
    
    var isSummoned = false;
    recognizer.recognized = async (s: Recognizer, e: SpeechRecognitionEventArgs) => {
        if (e.result.reason == ResultReason.RecognizedSpeech 
            && e.result.text.toLowerCase().replace(/[^a-zA-Z0-9]+/g, " ").trim() === spell) {
                const position = xr.baseExperience.camera.getFrontPosition(3);
                position.y = 0;
                // magicMeshes is the parent of both dragon and magicCircle
                env.magicMeshes.position = position;
                env.magicCircle.fadeIn(true);
                setTimeout(() => {
                    env.dragon.fadeIn(true);
                }, 500);
                isSummoned = true;
                recognizer.stopContinuousRecognitionAsync();
        }
    };

    xr.baseExperience.featuresManager.enableFeature(BABYLON.WebXRBackgroundRemover, 'latest', {
        backgroundMeshes: [env.skybox, env.ground]
    });

    xr.baseExperience.sessionManager.onXRSessionInit.add((eventData: XRSession, eventState: BABYLON.EventState) => {
        if (!isSummoned) {
            recognizer.startContinuousRecognitionAsync();
        }
    });

    xr.baseExperience.sessionManager.onXRSessionEnded.add((eventData: XRSession, eventState: BABYLON.EventState) => {
        recognizer.stopContinuousRecognitionAsync();
    });
    
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


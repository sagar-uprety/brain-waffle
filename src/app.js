import * as THREE from "three";
import { VRButton } from "three/examples/jsm/webxr/VRButton";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory.js";

import Brain from "./loader.js";

let startAnimation = false;
let currentFocus = 5;
let makenewCard = false;
let brainPosition;

let delayShowCard = true;

var infoDisease = [
  [4, 6, 5, 0, 2], //depression
  [5, 0], //bipolar
  [7, 5, 0], //dementia
  [8, 9, 10, 11, 2, 3], //schizophrenia
  [8, 9, 4, 0, 2, 3], //OCD
  [0, 1, 2, 3],
];

var diseaseDescrp = [
  {
    title: "Depression",
    description:
      "Brain Regions Affected:\nthe amygdala, hippocampus, thalamus.\n\n          Chemical Deficiency:\nnoradrenaline & serotonin\n\n                        Sadness, loss of interest or pleasure, feelings of guilt or low self-worth, disturbed sleep or appetite, tiredness, and poor concentration. People with depression may also have multiple physical complaints with no apparent physical cause",
  },
  {
    title: "Bipolar disorder",
    description:
      "Brain Regions Affected:\nHippocampus\n                                   \nChemical Deficiency:\nnoradrenaline & serotonin\n\n                        Consists of both manic and depressive episodes separated by periods of normal mood. elevated or irritable mood, over-activity, rapid speech, inflated self-esteem and a decreased need for sleep.",
  },
  {
    title: "Dementia",
    description:
      "Brain Regions Affected:\nentorhinal cortex and hippocampus.            \n\nChemical Deficiency:\nglutamate                                             \n\nthere is deterioration in cognitive function. It affects memory, thinking, orientation, comprehension, calculation, learning capacity, language, and judgement. The impairment in cognitive function is commonly accompanied, and occasionally preceded, by deterioration in emotional control, social behaviour, or motivation.",
  },
  {
    title: "Schizophrenia",
    description:
      "Brain Regions Affected:\nlobe regions.\n\n                                 Chemical Deficiency:\nglutamate\n\n                                        Characterized by distortions in thinking, perception, emotions, language, sense of self and behaviour. Common psychotic experiences include hallucinations (hearing, seeing or feeling things that are not there) and delusions (fixed false beliefs or suspicions that are firmly held even when there is evidence to the contrary). The disorder can make it difficult for people affected to work or study normally.",
  },
  {
    title: "Obsessive-Compulsive Disorder\n",
    description:
      "Brain Regions Affected:\nthe prefrontal cortex, and thalamus.          \n\nChemical Deficiency:\nglutamate                                        \n\nPatients with OCD are bothered by constant fears. These worrying thoughts make them perform repetitive actions. Missing a single step from their ritual increases their anxiety. This urges them to repeat the routine all over again to gain relief from their obsession. These rituals are called compulsions. For example, a person with a fear of germs would wash their hand every 10 minutes.",
  },
];

let infoParts = [[0, 4, 7, 5], [1], [2, 10, 9, 6], [3, 8, 11]];

let App = class App {
  constructor() {
    const container = document.createElement("div");
    document.body.appendChild(container);

    this.camera = this.createCamera();
    this.scene = this.createScene();
    this.renderer = this.createRenderer();
    container.appendChild(this.renderer.domElement);

    this.cameraGroup = new THREE.Group();
    this.cameraGroup.position.set(0, 1, 4);

    this.addLight();
    this.addRoom();
    this.sceneObjects = [];
    this.cards = [];
    this.lines = [];
    this.touchBox = false;
    this.touchSphere = false;
    this.touchOct = false;
    this.touchTet = false;

    this.controls = new OrbitControls(this.camera, container);
    this.controls.target.set(0, 1.6, 0);
    this.controls.update();

    this.session;
    this.renderer.xr.addEventListener("sessionstart", (event) => {
      this.session = this.renderer.xr.getSession();
      this.scene.add(this.cameraGroup);
      this.cameraGroup.add(this.camera);
    });
    this.renderer.xr.addEventListener("sessionend", (event) => {
      this.scene.remove(this.cameraGroup);
      this.cameraGroup.remove(this.camera);
      this.session = null;
    });

    this.raycaster = new THREE.Raycaster();
    this.workingMatrix = new THREE.Matrix4();

    this.setupVR();

    document.addEventListener("keyup", function (e) {
      if (e.keyCode == 9) {
        startAnimation = true;
        // makenewCard = true;
      } else if (e.keyCode == 68) {
        currentFocus = (currentFocus + 1) % 5;
        makenewCard = true;
      } else if (e.keyCode == 65) {
        currentFocus = (currentFocus - 1) % 5 < 0 ? 4 : (currentFocus - 1) % 5;
        makenewCard = true;
      }
    });

    this.renderer.setAnimationLoop(this.render.bind(this));
    window.addEventListener("resize", this.resize.bind(this));
  }

  createCamera() {
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );

    camera.position.set(0, 1.6, 3);
    return camera;
  }

  createScene() {
    const loader = new THREE.TextureLoader();

    const scene = new THREE.Scene();
    // scene.background = new THREE.Color(0x808080);

    loader.load("../assets/sky.jpg", function (texture) {
      scene.background = texture;
    });
    return scene;
  }

  createRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.xr.enabled = true;
    return renderer;
  }

  addLight() {
    const ambient = new THREE.HemisphereLight(0x606060, 0x404040, 0.5);
    this.scene.add(ambient);
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1).normalize();
    this.scene.add(light);
  }

  setupVR() {
    this.renderer.xr.enabled = true;
    document.body.appendChild(VRButton.createButton(this.renderer));

    const self = this;

    this.controllers = this.buildControllers();

    function onSelectStart() {
      // this.children[0].scale.z = 10;
      this.userData.selectPressed = true;
      startAnimation = true;

      if (!delayShowCard) {
        currentFocus = (currentFocus + 1) % 4;
        makenewCard = true;
      }
    }
  }
  render() {
    if (this.brain) {
      if (this.brain.model) {
        startAnimation ? this.animateBrain() : null;
      }
    }

    if (startAnimation == true) {
      delayShowCard = false;
    }

    this.renderer.render(this.scene, this.camera);

    // Loop FUnctions Here

    if (this.controllers) {
      const self = this;
      this.controllers.forEach((controller) => {
        self.handleController(controller);
      });
    }
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  buildControllers() {
    const controllerModelFactory = new XRControllerModelFactory();

    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1),
    ]);

    const line = new THREE.Line(geometry);
    line.name = "line";
    line.scale.z = 10;

    const controllers = [];

    for (let i = 0; i <= 1; i++) {
      const controller = this.renderer.xr.getController(i);
      controller.add(line.clone());
      controller.userData.selectPressed = false;
      this.scene.add(controller);

      // controller.position.set(10,10,10)

      controllers.push(controller);

      const grip = this.renderer.xr.getControllerGrip(i);
      grip.add(controllerModelFactory.createControllerModel(grip));

      // grip.position.set(10,10,10)

      this.scene.add(grip);
    }

    return controllers;
  }

  handleController(controller) {
    if (controller.userData.selectPressed) {
      controller.children[0].scale.z = 10;

      this.workingMatrix.identity().extractRotation(controller.matrixWorld);

      this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      this.raycaster.ray.direction
        .set(0, 0, -100)
        .applyMatrix4(this.workingMatrix);

      // this.scene.children.forEach( (c)=>{
      //     if(c.type === 'Mesh'){
      //         let name = Object.keys(c.geometry)
      //         console.log(c)
      //     }
      // })

      let intersects = this.raycaster.intersectObjects(this.scene.children);

      intersects.forEach((c) => {
        console.log(intersects);
        console.log(c.object.geometry.type);
      });

      // let intersectsObj = intersects.filter( (sceneChild) => {
      //     Object.keys(sceneChild.geometry)[0] ==
      // })

      // console.log(intersects)

      // if (intersects.length>0){
      //     intersects[0].object.add(this.highlight);
      //     this.highlight.visible = true;
      //     controller.children[0].scale.z = intersects[0].distance;
      // }else{
      //     this.highlight.visible = false;
      // }
    }
  }

  addRoom() {
    var mesh;
    var textureLoader = new THREE.TextureLoader();
    var map = textureLoader.load("../assets/military.jpg");
    map.encoding = THREE.sRGBEncoding;
    map.flipY = false;

    var lightMap = textureLoader.load("../assets/white.jpg");
    lightMap.encoding = THREE.sRGBEncoding;
    lightMap.flipY = false;
    const loader = new GLTFLoader().load("../assets/room3.glb", (gltf) => {
      // gltf.scene.scale.set( 400,400,400 );
      mesh = gltf.scene.children[0];
      mesh.material = new THREE.MeshPhongMaterial({
        lightMap: map,
        map: map,
        color: 0xffffff,
        lightMapIntensity: 1,
        reflectivity: 0.3,
      });
      this.addBrain();
      this.createMainCard({
        title: "Brain-Waffle",
        description: "Welcome to our project!!",
        size: [4, 4],
        orientation: {
          translate: [-8, 5, 0],
          rotation: [0, Math.PI / 2, 0],
        },
        color: "#000000",
        text: "#ffffff",
      });
      mesh.translateY(-2);
      this.scene.add(mesh);
    });
  }

  addBrain() {
    var mesh;

    this.markers = [];

    this.brain = new Brain(); // Don't load in constructor...
    // Perform load call here
    const loaded = this.brain
      .loadModel(this.brain.GLTFLoader, "../assets/brain.glb")
      .then((result) => {
        result.scene.scale.set(0.3, 0.3, 0.3);

        for (var i = 0; i < result.scene.children.length; i++) {
          mesh = result.scene.children[i];
          mesh.material = new THREE.MeshPhongMaterial({
            color: i < 4 ? 0xcd3149 : 0xffffff,
            reflectivity: 0.3,
            transparent: true,
            opacity: i < 4 ? 1 : 0.2,
          });
          // this.scene.add(mesh)
          this.markers.push(mesh);
        }

        this.brain.model = result.scene;
        brainPosition = this.brain.model.position;
        this.scene.add(this.brain.model);
      });

    loaded
      .then((res) => {
        this.brain.model.translateY(1.5);
        // console.log(this.brain.model.position);
        // x: 0, y: 1.5, z: 0
        // console.log( this.markers[0].material.opacity );
        // this.markers[0].opacity
      })
      .catch((err) => {
        console.log(err);
      });
  }
};
export default App;

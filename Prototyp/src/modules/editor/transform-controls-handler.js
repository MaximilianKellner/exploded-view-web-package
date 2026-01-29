import { TransformControls } from 'three/addons/controls/TransformControls.js';

export class TransformControlsHandler {
  constructor(camera, renderer, scene) {
    this.controls = new TransformControls(camera, renderer.domElement);
    this.scene = scene;
    this.cameraHandler = null;
    this.isDragging = false;
    this.preventNextClick = false;

    // Helper der TransformControls markieren, damit er nicht selektiert wird
    this.helper = this.controls.getHelper();
    this.helper.traverse(node => {
      node.userData = node.userData || {};
      node.userData.nonSelectable = true;
    });
    this.scene.add(this.helper);

    // Bind event handlers
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onObjectChange = this._onObjectChange.bind(this);

    // TransformControls Events abfangen
    this.controls.addEventListener('mouseDown', this._onMouseDown);
    this.controls.addEventListener('mouseUp', this._onMouseUp);
    this.controls.addEventListener('objectChange', this._onObjectChange);
  }

  setCameraHandler(cameraHandler) {
    this.cameraHandler = cameraHandler;
  }

  _onMouseDown() {
    this.isDragging = false;
    // OrbitControls deaktivieren während Gizmo verwendet wird
    if (this.cameraHandler) {
      this.cameraHandler.setControlsEnabled(false);
    }
  }

  _onObjectChange() {
    // Wird aufgerufen wenn das Objekt tatsächlich bewegt wird
    this.isDragging = true;
  }

  _onMouseUp() {
    // OrbitControls wieder aktivieren
    if (this.cameraHandler) {
      this.cameraHandler.setControlsEnabled(true);
    }

    // Wenn gedragged wurde, nächsten Click blockieren
    if (this.isDragging) {
      this.preventNextClick = true;
      // Flag wieder zurücksetzen
      setTimeout(() => {
        this.preventNextClick = false;
        this.isDragging = false;
      }, 50);
    }
  }

  attach(object) {
    this.controls.attach(object);
  }

  detach() {
    this.controls.detach();
  }

  setMode(mode) {
    this.controls.setMode(mode);
  }

  dispose() {
    this.controls.removeEventListener('mouseDown', this._onMouseDown);
    this.controls.removeEventListener('mouseUp', this._onMouseUp);
    this.controls.removeEventListener('objectChange', this._onObjectChange);
    this.scene.remove(this.helper);
    this.controls.dispose();
  }
}

import editorCss from '../css/editor.css?inline';

let injected = false;

export function loadEditorCss() {
    if (injected) return;
    
    try {
        const style = document.createElement('style');
        style.textContent = editorCss;
        style.setAttribute('data-exploded-viewer-editor', 'true');
        document.head.appendChild(style);
        injected = true;
        console.log('ExplodedViewer: Editor CSS injected.');
    } catch (e) {
        console.error('ExplodedViewer: Failed to inject editor CSS', e);
    }
}

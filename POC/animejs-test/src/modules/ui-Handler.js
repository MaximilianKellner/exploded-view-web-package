import { Pane } from 'tweakpane';
import { animate } from 'animejs';

export function initTweakpane(config,) {
    const pane = new Pane({
        title: 'Scene Controls',
    });

    // --- Animation Einstellungen ---
    const animationFolder = pane.addFolder({ title: 'Animation', expanded: true });

    // Erstelle die Animationsinstanz, ohne sie abzuspielen
    const animation = animate('.exp-simulator',{
        width: '100%', // Animate to 100%
        easing: 'easeInOutExpo',
        duration: 1000,
        autoplay: false,
    });

    // Setze den Update-Callback auf der erstellten Instanz
    animation.update = (anim) => {
        config.animationConfig.expFactor = anim.progress / 100;
        pane.refresh();
    };

    const progressbar = animationFolder.addBinding(
        config.animationConfig,
        'expFactor',
        { label: 'Progress', min: 0, max: 1, step: 0.01 }
    ).on('change', (ev) => {
        // Steuere die Animation, wenn der Slider bewegt wird
        animation.seek(animation.duration * ev.value);
    });

    const triggerAnimationButton = animationFolder.addButton(
        {
            title: 'Start Animation',
            label: 'Animate'
        });
    
    let hasPlayed = false;

    triggerAnimationButton.on('click', () => {
        animation.play();
        hasPlayed = !hasPlayed; // Toggle play state
        triggerAnimationButton.title = hasPlayed ? 'Stop Animation' : 'Start Animation';

        if (!hasPlayed) {
            animation.pause();
        } else {
            animation.play();
        }
    });

    return pane;
}
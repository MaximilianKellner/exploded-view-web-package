import Pickr from "@simonwep/pickr";
import '@simonwep/pickr/dist/themes/nano.min.css';

const triggers = document.querySelectorAll('.picker-trigger');

triggers.forEach(triggerEl => {
    // Unterelemente relativ zum aktuellen Trigger
    const previewBox = triggerEl.querySelector('.color-preview-box');
    const hexLabel = triggerEl.querySelector('.color-hex-label');
    const defaultColor = triggerEl.getAttribute('data-default') || '#333333';

    const pickr = Pickr.create({
        el: triggerEl,
        theme: "nano",
        useAsButton: true,
        default: defaultColor,

        components: {
            preview: true,
            opacity: false,
            hue: true,
            interaction: {
                hex: true,
                input: true,
                save: false, // docch an für events?
            },
        },
    });

    // Lokale Update-Funktion für diesen speziellen Picker
    const updateUI = (color) => {
        if (color) {
            const hex = color.toHEXA().toString().toLowerCase();
            hexLabel.textContent = hex;
            previewBox.style.backgroundColor = hex;
        }
    };

    // Events
    pickr.on("change", (color) => {
        updateUI(color);
    });

    pickr.on("save", (color) => {
        updateUI(color);
        pickr.hide();
    });

    // Initialisierung für diesen Picker
    pickr.on('init', instance => {
        updateUI(instance.getColor());
    });
});
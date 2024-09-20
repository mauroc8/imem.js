import { parseLegV8 } from "./parseLegV8"

window.addEventListener('DOMContentLoaded', main)

function main() {
    const codeOutput = document.querySelector('#code-output')
    const romSizeOutput = document.querySelector('#rom-size-output')
    const codeInput = document.querySelector<HTMLTextAreaElement>('#code-input')
    const isrInput = document.querySelector<HTMLTextAreaElement>('#isr-input')
    const copyOutputButton = document.querySelector<HTMLButtonElement>('#copy-output-button')
    const output = document.querySelector('#output')

    if (!codeOutput || !codeInput || !isrInput || !romSizeOutput || !copyOutputButton || !output) {
        alert('Error: node not found')
        throw { codeOutput, codeInput, isrInput, romSizeOutput, copyOutputButton, output }
    }

    initializeApp({ codeOutput, isrInput, codeInput, romSizeOutput, copyOutputButton, output })
}

function initializeApp({
    codeInput,
    isrInput,
    codeOutput,
    romSizeOutput,
    copyOutputButton,
    output,
}: {
    codeInput: HTMLTextAreaElement,
    isrInput: HTMLTextAreaElement,
    codeOutput: Element,
    romSizeOutput: Element,
    copyOutputButton: HTMLButtonElement,
    output: Element,
}) {
    // --- update output

    function updateOutput() {
        const { code, romSize } = parseLegV8(codeInput.value, isrInput.value);
        romSizeOutput.textContent = String(romSize);
        codeOutput.textContent = code;
    }

    const updateOutputDebounced = debounce(updateOutput, 450)

    updateOutputDebounced()

    codeInput.addEventListener('input', updateOutputDebounced)
    isrInput.addEventListener('input', updateOutputDebounced)

    // --- save/load code input

    const loadedCodeInput = localStorage.getItem('code-input')

    if (loadedCodeInput) {
        codeInput.value = loadedCodeInput
    }

    function saveCodeInput() {
        localStorage.setItem('code-input', codeInput.value)
    }

    const saveCodeInputDebounced = debounce(saveCodeInput, 800)

    codeInput.addEventListener('input', saveCodeInputDebounced);

    // --- save/load isr input

    const loadedIsrInput = localStorage.getItem('isr-input')

    if (loadedIsrInput) {
        codeInput.value = loadedIsrInput
    }

    function saveIsrInput() {
        localStorage.setItem('isr-input', codeInput.value)
    }

    const saveIsrInputDebounced = debounce(saveIsrInput, 800)

    isrInput.addEventListener('input', saveIsrInputDebounced);

    // --- copy output

    copyOutputButton.addEventListener('click', () => {
        navigator.clipboard.writeText(output.textContent || '')
    })
}

function debounce(fn, ms) {
    let timeout


    return () => {
        if (timeout) {
            clearTimeout(timeout)
        }

        timeout = setTimeout(() => {
            fn()
            timeout = null
        }, ms)
    }
}

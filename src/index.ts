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
    // --- persist input

    persistInputValue('code-input', codeInput);
    persistInputValue('isr-input', isrInput);

    // --- update output

    function updateOutput() {
        const { code, romSize } = parseLegV8(codeInput.value, isrInput.value);
        romSizeOutput.textContent = String(romSize - 1);
        codeOutput.textContent = code;
    }

    const updateOutputDebounced = debounce(updateOutput, 450)

    updateOutputDebounced()

    codeInput.addEventListener('input', updateOutputDebounced)
    isrInput.addEventListener('input', updateOutputDebounced)

    // --- copy output button

    copyOutputButton.addEventListener('click', () => {
        navigator.clipboard.writeText(output.textContent || '')
    })
}

function persistInputValue(key: string, input: HTMLTextAreaElement) {
    const loadedCodeInput = localStorage.getItem(key)

    if (loadedCodeInput) {
        input.value = loadedCodeInput
    }

    function saveInput() {
        localStorage.setItem(key, input.value)
    }

    const saveInputDebounced = debounce(saveInput, 800)

    input.addEventListener('input', saveInputDebounced)
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

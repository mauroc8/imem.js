import { compileLegV8, compileLegV8WithIRS, Instruction, Program, Register } from "./compileLegV8";



export function parseLegV8(code: string, isr: string): { code: string, romSize: number } {
    const codeLines = code.split('\n')
    const isrLines = isr.trim() ? isr.split('\n') : null

    try {
        const codeInstructions = codeLines.flatMap(parseLine)
        const compiledCode =
            isrLines
                ? compileLegV8WithIRS(codeInstructions, isrLines.flatMap(parseLine))
                : compileLegV8(...codeInstructions);

        return {
            code: `'{
      ${compiledCode.join(',\n      ')}
   };`,
            romSize: compiledCode.length,
        }
    } catch (error) {
        if (typeof error === 'string') {
            return {
                code: `
      ${error}
`, romSize: 0
            }
        } else {
            throw error
        }
    }
}

function parseLine(line: string, index: number): Program {
    // Untrimmed lines

    if (line !== line.trim()) {
        return parseLine(line.trim(), index)
    }

    // Empty lines

    if (line.length === 0) {
        return []
    }

    // Labels

    const labelRegExp = /^(\w+):/

    const labelMatch = line.match(labelRegExp)

    if (labelMatch) {
        const [match, label] = labelMatch

        return [
            label,
            // we continue parsing the rest of the line
            ...parseLine(line.substring(match.length), index)
        ]
    }

    // R-type

    const rTypeRegExp = /^(ADD|SUB|AND|ORR)\s+(X\d{1,2}|XZR),\s*(X\d{1,2}|XZR),\s*(X\d{1,2}|XZR)$/

    const rTypeMatch = line.match(rTypeRegExp)

    if (rTypeMatch) {
        const [_, op, rd, rn, rm] = rTypeMatch

        if (validateRegister(rd)
            && validateRegister(rn)
            && validateRegister(rm)) {
            switch (op) {
                case 'ADD':
                    return [{ ADD: [rd, rn, rm] }]

                case 'SUB':
                    return [{ SUB: [rd, rn, rm] }]

                case 'AND':
                    return [{ AND: [rd, rn, rm] }]

                case 'ORR':
                    return [{ ORR: [rd, rn, rm] }]
            }
        }

        throw `Instrucción tipo R inválida en la línea ${index}: "${line}"`
    }

    // LDUR/STUR

    const dTypeRegex = /^(LDUR|STUR)\s+(X\d{1,2}|XZR),\s*\[\s*(X\d{1,2}|XZR),\s*#(-?\d+)\s*\]$/

    const dTypeMatch = line.match(dTypeRegex)

    if (dTypeMatch) {
        const [_, op, rt, rn, dtAddr] = dTypeMatch

        if (validateRegister(rt) && validateRegister(rn)) {
            switch (op) {
                case 'LDUR':
                    return [{ LDUR: [rt, rn, Number(dtAddr)] }]

                case 'STUR':
                    return [{ STUR: [rt, rn, Number(dtAddr)] }]
            }
        }

        throw `Instrucción tipo D inválida en la línea ${index}: "${line}"`
    }

    // CBZ

    const cbzRegex = /^CBZ\s+(X\d{1,2}|XZR),\s*(\w+)$/

    const cbzMatch = line.match(cbzRegex)

    if (cbzMatch) {
        const [_, rt, label] = cbzMatch

        if (validateRegister(rt)) {
            return [{ CBZ: [rt, label] }]
        }

        throw `Instrucción CBZ inválida en la línea ${index}: "${line}"`
    }

    // ERET

    const eretRegex = /^ERET/

    const eretMatch = line.match(eretRegex)

    if (eretMatch) {
        return [{ ERET: [] }]
    }

    // BR

    const brRegex = /^BR\s+(X\d{1,2}|XZR)$/

    const brMatch = line.match(brRegex)

    if (brMatch) {
        const [_, rt] = brMatch

        if (validateRegister(rt)) {
            return [{ BR: [rt] }]
        }

        throw `Instrucción BR inválida en la línea ${index}: "${line}"`
    }

    // BR

    const mrsRegExp = /^MRS\s+(X\d{1,2}|XZR),\s*(S2_0_C[012]_C0_0)$/

    const mrsMatch = line.match(mrsRegExp)

    if (mrsMatch) {
        const [_, rt, systemRegister] = mrsMatch

        if (validateRegister(rt)
            && (systemRegister === 'S2_0_C0_C0_0'
                || systemRegister === 'S2_0_C1_C0_0'
                || systemRegister === 'S2_0_C2_C0_0'
            )
        ) {
            return [{ MRS: [rt, systemRegister] }]
        }

        throw `Instrucción MRS inválida en la línea ${index}: "${line}"`
    }

    if (line === 'INVALID_INSTRUCTION') {
        return [{ INVALID_INSTRUCTION: [] }]
    }

    // Comentarios

    if (line.startsWith('//')) {
        return []
    }

    throw `Instrucción inválida en la línea ${index}: "${line}"`
}

function validateRegister(register: string): register is Register {
    return range(0, 30).map(n => `X${n}`).includes(register) || register === 'XZR'
}

function range(start: number, end: number): number[] {
    return Array.from({ length: end - start + 1 }).map((_, n) => n + start);
}

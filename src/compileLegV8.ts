
// ---

type BinaryDigit = '0' | '1';

// ---

type BinaryNumber = BinaryDigit[];

function b(...args: (string | BinaryNumber)[]): BinaryNumber {
    return args.flatMap(bHelper);
}

function bHelper(arg: string | BinaryNumber): BinaryNumber {
    if (arg instanceof Array) {
        return arg;
    } else {
        if (/[^01_]/.test(arg)) {
            throw `El número ${arg} debería ser un número binario`;
        }

        return arg.replace(/_/g, '').split('') as BinaryNumber;
    }

}

function decimalToBinary(number: number, amountOfBits: number): BinaryNumber {
    if (number >= 0) {
        return b(number.toString(2).padStart(amountOfBits, '0'));
    } else {
        return decimalToBinary(
            Math.pow(2, amountOfBits) + number,
            amountOfBits
        );
    }
}

// ---

type HexDigit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'a' | 'b' | 'c' | 'd' | 'e' | 'f';

function hexDigitToBinary(digit: HexDigit): BinaryNumber {
    switch (digit) {
        case '0': return b('0000');
        case '1': return b('0001');
        case '2': return b('0010');
        case '3': return b('0011');
        case '4': return b('0100');
        case '5': return b('0101');
        case '6': return b('0110');
        case '7': return b('0111');
        case '8': return b('1000');
        case '9': return b('1001');
        case 'a': return b('1010');
        case 'b': return b('1011');
        case 'c': return b('1100');
        case 'd': return b('1101');
        case 'e': return b('1110');
        case 'f': return b('1111');
    }
}

// ---

type Nibble = `${BinaryDigit}${BinaryDigit}${BinaryDigit}${BinaryDigit}`;

function nibbleToHex(nibble: Nibble): HexDigit {
    switch (nibble) {
        case '0000': return '0';
        case '0001': return '1';
        case '0010': return '2';
        case '0011': return '3';
        case '0100': return '4';
        case '0101': return '5';
        case '0110': return '6';
        case '0111': return '7';
        case '1000': return '8';
        case '1001': return '9';
        case '1010': return 'a';
        case '1011': return 'b';
        case '1100': return 'c';
        case '1101': return 'd';
        case '1110': return 'e';
        case '1111': return 'f';
    }
}

// ---

type HexNumber = HexDigit[];

function h(str: string): HexNumber {
    if (/[^0123456789ABCDEF_]/i.test(str)) {
        throw `El número ${str} debería ser un número hexadecimal`;
    }

    return str.replace(/_/g, '').toLowerCase().split('') as HexNumber;
}


function binaryToHex(binary: BinaryNumber): HexNumber {
    if (binary.length < 4) {

        if (binary.length !== 0) {
            throw `binaryNumberToHex asume que el número ${binary.join('')} tiene length divisible por 4`;
        }

        return [];
    } else {
        const [a, b, c, d, ...rest] = binary;

        const word: Nibble = `${a}${b}${c}${d}`;

        try {
            return [nibbleToHex(word), ...binaryToHex(rest)];

        } catch (_) {
            throw `binaryNumberToHex asume que el número ${binary.join('')} tiene length divisible por 4`;
        }
    }
}

// ---

export type Register = 'X0' | 'X1' | 'X2' | 'X3' | 'X4' | 'X5' | 'X6' | 'X7' | 'X8' | 'X9'
    | 'X10' | 'X11' | 'X12' | 'X13' | 'X14' | 'X15' | 'X16' | 'X17' | 'X18' | 'X19'
    | 'X20' | 'X21' | 'X22' | 'X23' | 'X24' | 'X25' | 'X26' | 'X27' | 'X28' | 'X29'
    | 'X30' | 'XZR';

const XZR = 'XZR';

function registerToBinary(register: Register): BinaryNumber {
    if (register === 'XZR') {
        return decimalToBinary(31, 5);
    } else {
        const match = register.match(/X(\d+)/);

        if (!match) {
            throw `Invalid register ${register}`
        }

        const [_, d] = match;
        const n = Number(d);

        if (n < 0 || n > 30) {
            throw `Invalid register ${register}`
        }

        return decimalToBinary(n, 5);
    }
}

// ---

type SystemRegister = ExceptionReturnRegister | ExceptionLinkRegister | ExceptionSyndromeRegister;

type ExceptionReturnRegister = 'S2_0_C0_C0_0';
type ExceptionLinkRegister = 'S2_0_C1_C0_0';
type ExceptionSyndromeRegister = 'S2_0_C2_C0_0';

function systemRegisterToBinary(systemRegister: SystemRegister): BinaryNumber {
    switch (systemRegister) {
        case 'S2_0_C0_C0_0':
            return b('0000');

        case 'S2_0_C1_C0_0':
            return b('0001');

        case 'S2_0_C2_C0_0':
            return b('0010');
    }
}

// ---

export type Instruction =
    | { STUR: [Register, Register, number] }
    | { LDUR: [Register, Register, number] }
    | { ADD: [Register, Register, Register] }
    | { SUB: [Register, Register, Register] }
    | { AND: [Register, Register, Register] }
    | { ORR: [Register, Register, Register] }
    | { ADDI: [Register, Register, number] }
    | { SUBI: [Register, Register, number] }
    | { CBZ: [Register, string] }
    | { ERET: [] }
    | { NOP: [] }
    | { MRS: [Register, SystemRegister] }
    | { BR: [Register] }
    | { INVALID_INSTRUCTION: [] }

function encodeInstructionToBinary(instruction: Instruction, instructionIndex: number, labelIndex: Record<string, number>): BinaryNumber {
    if ('STUR' in instruction) {
        const [rt, rn, dtAddress] = instruction.STUR;

        const opCode = '111_1100_0000';

        return b(
            opCode,
            decimalToBinary(dtAddress, 9),
            '00',
            registerToBinary(rn),
            registerToBinary(rt)
        );
    }

    if ('LDUR' in instruction) {
        const [rt, rn, dtAddress] = instruction.LDUR;

        const opCode = '111_1100_0010';

        return b(
            opCode,
            decimalToBinary(dtAddress, 9),
            '00',
            registerToBinary(rn),
            registerToBinary(rt)
        );
    }

    function rType(args: [Register, Register, Register]): BinaryNumber {
        const [rd, rn, rm] = args;

        return b(
            registerToBinary(rm),
            '000000', // shamt
            registerToBinary(rn),
            registerToBinary(rd)
        );
    }

    function iType(args: [Register, Register, number]): BinaryNumber {
        const [rd, rn, aluImm] = args;

        return b(
            decimalToBinary(aluImm, 12),
            registerToBinary(rn),
            registerToBinary(rd)
        );
    }

    if ('ADD' in instruction) {
        const opCode = '100_0101_1000';

        return b(opCode, rType(instruction.ADD));
    }

    if ('SUB' in instruction) {
        const opCode = '110_0101_1000';

        return b(opCode, rType(instruction.SUB));
    }

    if ('AND' in instruction) {
        const opCode = '100_0101_0000';

        return b(opCode, rType(instruction.AND));
    }

    if ('ORR' in instruction) {
        const opCode = '101_0101_0000';

        return b(opCode, rType(instruction.ORR));
    }

    if ('ADDI' in instruction) {
        const opCode = '100_1000_100';

        return b(opCode, iType(instruction.ADDI));
    }

    if ('SUBI' in instruction) {
        const opCode = '110_1000_100';

        return b(opCode, iType(instruction.SUBI));
    }

    if ('CBZ' in instruction) {
        const [rt, label] = instruction.CBZ;

        if (typeof labelIndex[label] !== 'number') {
            throw `Label inexistente: "${label}"`;
        }

        const condBrAddress = labelIndex[label] - instructionIndex;


        const opCode = '101_1010_0';

        return b(
            opCode,
            decimalToBinary(condBrAddress, 19),
            registerToBinary(rt)
        );
    }

    if ('ERET' in instruction) {
        const opCode = '1101011_0100';

        return b(
            opCode,
            '11111',
            '000000',
            '11111',
            '00000'
        );
    }

    if ('NOP' in instruction) {
       return encodeInstructionToBinary({ ADD: [XZR, XZR, XZR] }, instructionIndex, labelIndex);
    }

    if ('MRS' in instruction) {
        const [rt, systemRegister] = instruction.MRS;

        const opCode = '11010101001';

        return b(
            opCode,
            '10',
            '000',
            systemRegisterToBinary(systemRegister),
            '0000',
            '000',
            registerToBinary(rt)
        );
    }

    if ('BR' in instruction) {
        const [rn] = instruction.BR;

        const opCode = '1101011_0000';

        return b(
            opCode,
            '11111',
            '000000',
            registerToBinary(rn),
            '00000'
        );
    }

    if ('INVALID_INSTRUCTION' in instruction) {
        return repeat('0', 32);
    }

    throw `Invalid instruction: ${JSON.stringify(instruction)}`;
}

function encodeInstruction(instruction: Instruction, instructionIndex: number, labelIndex: Record<string, number>): HexNumber {
    return binaryToHex(encodeInstructionToBinary(instruction, instructionIndex, labelIndex));
}

function instructionSource(instruction: Instruction): string {
    if ('STUR' in instruction) {
        const [rt, rn, dtAddress] = instruction.STUR;

        const opCode = '111_1100_0000';

        return `STUR ${rt}, [${rn}, #${dtAddress}]`;
    }

    if ('LDUR' in instruction) {
        const [rt, rn, dtAddress] = instruction.LDUR;

        const opCode = '111_1100_0010';

        return `LDUR ${rt}, [${rn}, #${dtAddress}]`;

    }

    function rType(args: [Register, Register, Register]): string {
        const [rd, rn, rm] = args;

        return `${rd}, ${rn}, ${rm}`;
    }

    function iType(args: [Register, Register, number]): string {
        const [rd, rn, aluImm] = args;

        return `${rd}, ${rn}, #${aluImm}`;
    }

    if ('ADD' in instruction) {
        return `ADD ${rType(instruction.ADD)}`;
    }

    if ('SUB' in instruction) {
        return `SUB ${rType(instruction.SUB)}`;
    }

    if ('AND' in instruction) {
        return `AND ${rType(instruction.AND)}`;
    }

    if ('ORR' in instruction) {
        return `ORR ${rType(instruction.ORR)}`;
    }

    if ('ADDI' in instruction) {
        return `ADDI ${iType(instruction.ADDI)}`;
    }

    if ('SUBI' in instruction) {
        return `SUBI ${iType(instruction.SUBI)}`;
    }

    if ('CBZ' in instruction) {
        const [rt, label] = instruction.CBZ;

        return `CBZ ${rt}, ${label}`;
    }

    if ('ERET' in instruction) {
        return `ERET`;
    }

    if ('NOP' in instruction) {
        return `NOP`;
    }

    if ('MRS' in instruction) {
        const [rt, systemRegister] = instruction.MRS;

        return `MRS ${rt}, ${systemRegister}`;
    }

    if ('BR' in instruction) {
        const [rn] = instruction.BR;

        return `BR ${rn}`;
    }

    if ('INVALID_INSTRUCTION' in instruction) {
        return 'INVALID_INSTRUCTION';
    }

    return `???`;
}

// ---

export type Program = (Instruction | string)[];

function encode(...originalProgram: Program): string[] {
    const labelIndex: Record<string, number> = {};

    // a copy to avoid mutating the original program
    const program = [...originalProgram];

    for (let i = 0; i < program.length; i += 1) {
        const label = program[i];

        if (typeof label === 'string') {
            if (label in labelIndex) {
                throw `El label "${label}" está duplicado`;
            }

            labelIndex[label] = i;

            program.splice(i, 1);
            i -= 1;
        }
    }

    return (program as Instruction[])
        .map((instruction, index) => encodeInstruction(instruction, index, labelIndex).join(''));
}

export function compileLegV8(...program: Program): string[] {
    return encode(...program).map(instruction => `32'h${instruction}`);
}

const NOP: Instruction = { NOP: [] };

function repeat<A>(value: A, n: number): A[] {
    if (n <= 0) {
        return [];
    } else {
        return [value, ...repeat(value, n - 1)];
    }
}

export function compileLegV8WithIRS(program: Program, exceptionVector: Program): string[] {
    const instructionCount = program.reduce(
        (sum, instructionOrLabel) => typeof instructionOrLabel !== 'string'
            ? sum + 1
            : sum,
        0
    );

    if (instructionCount >= 54) {
        throw 'El programa tiene más de 54 instrucciones y sobreescribe el vector de excepciones';
    }

    return compileLegV8(
        ...program,
        ...repeat(NOP, 54 - instructionCount),
        // El vector de excepciones está en la instrucción nro 54
        ...exceptionVector,
    );
}


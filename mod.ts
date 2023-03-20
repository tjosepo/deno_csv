function* lineParser(
  options: { separator?: string } = {}
): Generator<undefined, string[], string> {
  const { separator = "," } = options;
  const line: string[] = [];
  let escaped = false;
  let field = "";

  while (true) {
    let char = yield;

    if (char && escaped) {
      if (char === '"') {
        const nextChar = yield;
        if (nextChar === '"') {
          field += '"';
        } else {
          escaped = false;
          char = nextChar;
        }
      } else {
        field += char;
      }
    }

    if (char && !escaped) {
      if (char === '"') {
        if (field.trim().length === 0) {
          escaped = true;
        } else {
          throw new SyntaxError(
            'Character `"` cannot appear in the middle of an unescaped field'
          );
        }
      } else if (char === separator) {
        line.push(field.trim());
        field = "";
      } else if (char === "\n") {
        line.push(field.trim());
        return line;
      } else {
        field += char;
      }
    }

    if (!char && field.trim()) {
      line.push(field.trim());
      field = "";
    }

    if (!char) {
      return line;
    }
  }
}

class CSVDecoderSteam extends TransformStream<string, string[]> {
  constructor() {
    let parser: Generator<undefined, string[], string>;

    super({
      start() {
        parser = lineParser();
        parser.next();
      },
      transform(chunk, controller) {
        for (const char of chunk) {
          const { value, done } = parser.next(char);
          if (done) {
            controller.enqueue(value);
            parser = lineParser();
            parser.next();
          }
        }
      },
      flush(controller) {
        const { value } = parser.next();
        if (value) controller.enqueue(value);
      },
    });
  }
}

export const read = (source: ReadableStream<Uint8Array>) => {
  return source
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new CSVDecoderSteam());
};

export function parse(source: string, options: { separator?: string, header: true }): Record<string, string>[];
export function parse(source: string, options?: { separator?: string, header?: false }): string[][];
export function parse(source: string, options: { separator?: string, header?: boolean } = {}) {
  const { header = false} = options;
  const result: (string[] | Record<string, string>)[] = [];
  let fieldNames: string[] | undefined;
  let parser = lineParser(options);
  parser.next();

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    let { value, done } = parser.next(char);

    if (i === source.length - 1) {
      // Do this for the last line
      ({ value, done } = parser.next());
    }

    if (!done) {
      continue;
    }

    if (header) {
      if (fieldNames === undefined) {
        fieldNames = value;
      } else {
        const record: Record<string, string> = {};
        for (let i = 0; i < fieldNames.length; i++) {
          record[fieldNames[i]] = value![i];
        }
        result.push(record);
      }
    } else {
      result.push(value!);
    }

    parser = lineParser(options);
    parser.next();
  }

  return result;
};
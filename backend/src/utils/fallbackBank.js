function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function randomInt(max = 10) {
  return Math.floor(Math.random() * max);
}

export const fallbackGenerators = {

  JavaScript: {

    beginner: [
      () => {
        const a = randomInt();
        const b = randomInt();
        return {
          question: `What is the output of console.log(${a} + ${b});`,
          options: shuffle([
            `${a + b}`,
            `${a}${b}`,
            "NaN",
            "Error"
          ]),
          answer: `${a + b}`,
          hints: ["Simple addition", "Both are numbers"]
        };
      },

      () => {
        const value = randomInt();
        return {
          question: `What is the type of ${value} in JavaScript?`,
          options: shuffle(["number", "string", "boolean", "object"]),
          answer: "number",
          hints: ["Primitive type"]
        };
      }
    ],

    intermediate: [
      () => {
        const a = randomInt();
        const b = randomInt();
        return {
          question: `What is the output of console.log(${a} + '${b}');`,
          options: shuffle([
            `${a}${b}`,
            `${a + b}`,
            "NaN",
            "Error"
          ]),
          answer: `${a}${b}`,
          hints: ["Type coercion", "Number + string becomes string"]
        };
      }
    ],

    advanced: [
      () => {
        return {
          question: "What does Object.freeze() do?",
          options: shuffle([
            "Prevents modification",
            "Deletes object",
            "Clones object",
            "Converts to JSON"
          ]),
          answer: "Prevents modification",
          hints: ["Makes object immutable"]
        };
      }
    ]
  },

  "C++": {

    beginner: [
      () => {
        const a = randomInt();
        const b = randomInt();
        return {
          question: `What is the output of cout << ${a} + ${b};`,
          options: shuffle([
            `${a + b}`,
            `${a}${b}`,
            "Compilation Error",
            "Runtime Error"
          ]),
          answer: `${a + b}`,
          hints: ["Integer addition"]
        };
      }
    ],

    intermediate: [
      () => {
        return {
          question: "Which keyword is used for dynamic memory allocation?",
          options: shuffle(["new", "malloc", "alloc", "create"]),
          answer: "new",
          hints: ["C++ operator"]
        };
      }
    ],

    advanced: [
      () => {
        return {
          question: "What is move semantics in C++?",
          options: shuffle([
            "Resource transfer optimization",
            "Pointer arithmetic",
            "Garbage collection",
            "Stack allocation"
          ]),
          answer: "Resource transfer optimization",
          hints: ["Introduced in C++11"]
        };
      }
    ]
  },

  Java: {

    beginner: [
      () => {
        const a = randomInt();
        const b = randomInt();
        return {
          question: `What is the output of System.out.println(${a} + ${b});`,
          options: shuffle([
            `${a + b}`,
            `${a}${b}`,
            "Compilation Error",
            "Runtime Error"
          ]),
          answer: `${a + b}`,
          hints: ["Integer addition"]
        };
      }
    ],

    intermediate: [
      () => {
        return {
          question: "Which keyword is used for inheritance in Java?",
          options: shuffle(["extends", "implements", "inherits", "super"]),
          answer: "extends",
          hints: ["Used in class definition"]
        };
      }
    ],

    advanced: [
      () => {
        return {
          question: "What is JVM?",
          options: shuffle([
            "Java Virtual Machine",
            "Java Variable Method",
            "Java Verified Mode",
            "Joint Virtual Memory"
          ]),
          answer: "Java Virtual Machine",
          hints: ["Executes Java bytecode"]
        };
      }
    ]
  }
};
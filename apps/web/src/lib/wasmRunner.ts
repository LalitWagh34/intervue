// Dynamically load Pyodide
let pyodide: any = null;
let pyodideLoading: Promise<any> | null = null;

export async function initPyodide() {
  if (pyodide) return pyodide;
  if (!pyodideLoading) {
    pyodideLoading = new Promise(async (resolve, reject) => {
      try {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
        script.onload = async () => {
          // @ts-ignore
          pyodide = await window.loadPyodide();
          resolve(pyodide);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      } catch (err) {
        reject(err);
      }
    });
  }
  return pyodideLoading;
}

export interface WasmExecutionResult {
  stdout: string;
  stderr: string;
  error?: string;
}

export async function executePythonLocal(
  sourceCode: string,
  input: string
): Promise<WasmExecutionResult> {
  const py = await initPyodide();
  
  // Override sys.stdin and sys.stdout
  await py.runPythonAsync(`
import sys
import io

# Setup fake stdin
sys.stdin = io.StringIO("""${input.replace(/"/g, '\\"')}""")

# Setup fake stdout/stderr
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
  `);

  let error = "";
  try {
    await py.runPythonAsync(sourceCode);
  } catch (err: any) {
    error = err.toString();
  }

  // Get outputs
  const [stdout, stderr] = await py.runPythonAsync(`
[sys.stdout.getvalue(), sys.stderr.getvalue()]
  `);

  return { stdout, stderr, error };
}

export async function executeJavascriptLocal(
  sourceCode: string,
  input: string
): Promise<WasmExecutionResult> {
  return new Promise((resolve) => {
    // We run JS in a web worker to prevent it from locking the main thread
    const workerCode = `
      self.onmessage = function(e) {
        const { sourceCode, input } = e.data;
        let stdout = "";
        let stderr = "";
        
        // Mock console.log
        const originalConsole = console;
        const fakeConsole = {
          log: (...args) => { stdout += args.map(String).join(" ") + "\\n"; },
          error: (...args) => { stderr += args.map(String).join(" ") + "\\n"; },
          warn: (...args) => { stderr += args.map(String).join(" ") + "\\n"; },
        };
        
        // Provide input via a global prompt-like function if needed,
        // or just let them read from a predefined global 'INPUT'
        self.INPUT = input;
        
        try {
          // Bind the fake console
          const func = new Function('console', 'INPUT', sourceCode);
          func(fakeConsole, input);
          self.postMessage({ stdout, stderr });
        } catch(err) {
          self.postMessage({ stdout, stderr, error: err.toString() });
        }
      }
    `;
    
    const blob = new Blob([workerCode], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    
    // Safety timeout (e.g. 5 seconds)
    const timeout = setTimeout(() => {
      worker.terminate();
      resolve({ stdout: "", stderr: "", error: "Timeout: Code took too long to execute" });
    }, 5000);

    worker.onmessage = (e) => {
      clearTimeout(timeout);
      resolve(e.data);
      worker.terminate();
    };

    worker.onerror = (err) => {
      clearTimeout(timeout);
      resolve({ stdout: "", stderr: "", error: err.message });
      worker.terminate();
    };

    worker.postMessage({ sourceCode, input });
  });
}

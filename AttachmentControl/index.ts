import { IInputs, IOutputs } from "./generated/ManifestTypes";

interface FileObject {
  name: string;
  contents: string; // base64
}

export class AttachmentControl implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  private container: HTMLDivElement;
  private notifyOutputChanged: () => void;
  private files: FileObject[] = [];
  private enableList: boolean;

  constructor() { }

  public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement) {
    this.container = container;
    this.notifyOutputChanged = notifyOutputChanged;
    this.enableList = context.parameters.enableList.raw;

    const initialValue = context.parameters.files.raw;
    if (initialValue) {
      try {
        this.files = JSON.parse(initialValue);
      } catch (err) {
        console.warn("Failed to parse input files", err);
        this.files = [];
      }
    }

    this.render();
  }

  private render() {
    this.container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "canvasify-atchCtrl-attachment-wrapper";

    // Create the hidden input
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.style.display = "none";

    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        this.handleFileUploads(Array.from(target.files));
      }
    };

    // Drop zone
    const dropZone = document.createElement("div");
    dropZone.className = "canvasify-atchCtrl-drop-zone";
    if(!this.enableList){dropZone.style.height = "-webkit-fill-available";};
    dropZone.innerText = "Click or drag files here to upload";

    // 💡 Click triggers file input
    dropZone.onclick = () => input.click();

    // Drag handlers
    dropZone.ondragover = (e) => {
      e.preventDefault();
      dropZone.classList.add("canvasify-atchCtrl-drag-over");
    };

    dropZone.ondragleave = () => {
      dropZone.classList.remove("canvasify-atchCtrl-drag-over");
    };

    dropZone.ondrop = (e) => {
      e.preventDefault();
      dropZone.classList.remove("canvasify-atchCtrl-drag-over");
      const droppedFiles = Array.from(e.dataTransfer?.files || []);
      this.handleFileUploads(droppedFiles);
    };
    
    const fileList = document.createElement("ul");
    fileList.classList.add("canvasify-atchCtrl-ul");
    this.files.forEach((file, index) => {
      const li = document.createElement("li");
      li.className = "canvasify-atchCtrl-file-entry";
      li.innerHTML = "<p>" + file.name + "</p>";

      const downloadBtn = document.createElement("button");
      downloadBtn.classList.add("canvasify-atchCtrl-button");
      downloadBtn.innerText = "💾";
      downloadBtn.onclick = () => {
        const link = document.createElement("a");
        link.href = `data:application/octet-stream;base64,${file.contents}`;
        link.download = file.name;
        link.click();
      };

      const removeBtn = document.createElement("button");
      removeBtn.classList.add("canvasify-atchCtrl-button");
      removeBtn.innerText = "🗑️";
      removeBtn.onclick = () => {
        this.files.splice(index, 1);
        this.render();
        this.notifyOutputChanged();
      };

      li.appendChild(downloadBtn);
      li.appendChild(removeBtn);
      fileList.appendChild(li);
    });

    // Assemble
    wrapper.appendChild(dropZone);
    wrapper.appendChild(input); // keep the input attached to DOM
    if (this.enableList) { wrapper.appendChild(fileList) };
    this.container.appendChild(wrapper);
  }



  private handleFileUploads(fileList: File[]) {
    const readPromises = fileList.map(file => {
      return new Promise<FileObject>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1]; // strip data URL prefix
          resolve({ name: file.name, contents: base64 });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then(results => {
      this.files.push(...results);
      this.render();
      this.notifyOutputChanged();
    });
  }

  public getOutputs(): IOutputs {
    return {
      files: JSON.stringify(this.files)
    };
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {
    // No reactive updates required.
  }

  public destroy(): void {
    this.container.innerHTML = "";
  }
}

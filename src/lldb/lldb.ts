// Copyright (c) 2016 Anarchy Tools Contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { precondition } from "../utils/assertion";
import fs = require("fs");
import { ChildProcess } from "child_process";
import process = require("child_process");

export class CommandResponse {
    output: string;
}

/**
 * A proxy used to control the interop with the debugger instance.
 */
export class Debugger {
    private _binaryPath: string;
    get binaryPath(): string { return this._binaryPath; }

    private _attached: boolean
    get isAttached(): boolean { return this._attached; }

    private _lldb: ChildProcess = null

    static get lldbPath(): string {
        // TODO(owensd): Perform this lookup in a more reliable way...
        return "/usr/bin/lldb";
    }

    /**
     * Creates a new proxy to the debugger.
     *
     * @param path The path to the executable to attach to.
     */
    constructor(path: string) {
        this._binaryPath = path;
        this._attached = false;
    }

    /**
     * This will start the debugger and attempt to attach to the binary.
     */
    attach(): Promise<CommandResponse> {
        precondition(!this.isAttached, "debugger.lldb.alreadyattached");

        let fullPath = fs.realpathSync(this.binaryPath);
        precondition(fs.existsSync(fullPath), "debugger.lldb.binarydoesnotexist");

        let self = this;
        return new Promise((resolve, reject) => {
            let lldb = process.spawn(Debugger.lldbPath, [self.binaryPath]);

            let output = lldb.stdout.read();


            let timer = null;
            let response = "";
            lldb.stdout.on("data", (bytes: Uint8Array) => {
                if (timer != null) { clearTimeout(timer); }

                let str = (bytes + "");
                response += str;

                // TODO(owensd): This seems incredibly hacky...
                timer = setTimeout(() => {
                    resolve({ output: response });
                }, 250);
            });
        });
    }
}
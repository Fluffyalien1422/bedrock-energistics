export type ScriptEventListener<TPayload> = (payload: TPayload) => void;
export type ScriptEventHandler<TPayload, TResponse> = (payload: TPayload) => TResponse;
export declare function registerScriptEventListener<TPayload>(event: string, callback: ScriptEventListener<TPayload>): void;
export declare function removeScriptEventListener(event: string): void;
export declare function registerScriptEventHandler<TPayload, TResponse>(event: string, callback: ScriptEventHandler<TPayload, TResponse>): void;
export declare function removeScriptEventHandler(event: string): void;
export declare function dispatchScriptEvent(event: string, payload: unknown): void;
export declare function invokeScriptEvent<TPayload, TResponse>(event: string, payload: TPayload): Promise<TResponse>;

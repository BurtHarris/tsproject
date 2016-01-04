﻿import ts = require( "typescript" );
import fs = require( "fs" );
import path = require( "path" );
import chokidar = require( "chokidar" );

import { Logger } from "../Reporting/Logger";
import { TsCore } from "../Utils/tscore";
import { Utils } from "../Utils/Utilities";

/**
 * @description A typescript compiler host that supports incremental builds and optimizations for file reads and file exists functions. Emit output is saved to memory.
 */
export class CachingCompilerHost implements ts.CompilerHost {

    private output: ts.Map<string> = {};
    private dirExistsCache: ts.Map<boolean> = {};
    private dirExistsCacheSize: number = 0;
    private fileExistsCache: ts.Map<boolean> = {};
    private fileExistsCacheSize: number = 0;
    private fileReadCache: ts.Map<string> = {};

    protected compilerOptions;
    private baseHost: ts.CompilerHost;

    constructor( compilerOptions: ts.CompilerOptions ) {
        this.compilerOptions = compilerOptions;

        this.baseHost = ts.createCompilerHost( this.compilerOptions );
    }

    public getOutput() {
        return this.output;
    }

    public getSourceFileImpl( fileName: string, languageVersion: ts.ScriptTarget, onError?: ( message: string ) => void ): ts.SourceFile {

        // Use baseHost to get the source file
        //Logger.log( "getSourceFile() reading source file from fs: ", fileName );
        return this.baseHost.getSourceFile( fileName, languageVersion, onError );
    }

    public getSourceFile = this.getSourceFileImpl;

    public writeFile( fileName: string, data: string, writeByteOrderMark: boolean, onError?: ( message: string ) => void ) {
        this.output[fileName] = data;
    }

    public fileExists = ( fileName: string ): boolean => {
        fileName = this.getCanonicalFileName( fileName );

        // Prune off searches on directories that don't exist
        if ( !this.dirExists( path.dirname( fileName ) ) ) {
            return false;
        }

        if ( Utils.hasProperty( this.fileExistsCache, fileName ) ) {
            //Logger.log( "fileExists() Cache hit: ", fileName, this.fileExistsCache[ fileName ] );
            return this.fileExistsCache[fileName];
        }
        this.fileExistsCacheSize++;

        //Logger.log( "fileExists() Adding to cache: ", fileName, this.baseHost.fileExists( fileName ), this.fileExistsCacheSize );
        return this.fileExistsCache[fileName] = this.baseHost.fileExists( fileName );
    }

    public readFile( fileName ): string {
        if ( Utils.hasProperty( this.fileReadCache, fileName ) ) {
            //Logger.log( "readFile() cache hit: ", fileName );
            return this.fileReadCache[fileName];
        }

        //Logger.log( "readFile() Adding to cache: ", fileName );
        return this.fileReadCache[fileName] = this.baseHost.readFile( fileName );
    }

    // Use Typescript CompilerHost "base class" implementation..

    public getDefaultLibFileName( options: ts.CompilerOptions ) {
        return this.baseHost.getDefaultLibFileName( options );
    }

    public getCurrentDirectory() {
        return this.baseHost.getCurrentDirectory();
    }

    public getCanonicalFileName( fileName: string ) {
        return this.baseHost.getCanonicalFileName( fileName );
    }

    public useCaseSensitiveFileNames() {
        return this.baseHost.useCaseSensitiveFileNames();
    }

    public getNewLine() {
        return this.baseHost.getNewLine();
    }

    public dirExists( directoryPath: string ): boolean {
        if ( Utils.hasProperty( this.dirExistsCache, directoryPath ) ) {
            //Logger.log( "dirExists() hit", directoryPath, this.dirExistsCache[ directoryPath ] );
            return this.dirExistsCache[directoryPath];
        }
        this.dirExistsCacheSize++;

        //Logger.log( "dirExists Adding: ", directoryPath, ts.sys.directoryExists( directoryPath ), this.dirExistsCacheSize );
        return this.dirExistsCache[directoryPath] = ts.sys.directoryExists( directoryPath );
    }
}
import { T_analyzeGrain } from "../types/api/T_analyzeGrain";
import { QCGabah } from '../types/model/table/QCGabah';
import { QualityParameter } from '../types/model/table/QualityParameter';
import { AppDataSource } from '../data-source';
import { qcGabahRepository } from "../src/repositories/qc-gabah.repository";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

export const t_analyzeGrain: T_analyzeGrain = async (req, res) => {
    try {
        const { image_base64, supplier, lot } = req.body;

        // 1. Decode Base64 and Save to Temp File
        const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        const timestamp = Date.now();
        const tempFileName = `upload_${timestamp}.jpg`;
        const tempPath = path.resolve(__dirname, '../../tmp', tempFileName);

        // Ensure tmp dir exists
        const tmpDir = path.dirname(tempPath);
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        fs.writeFileSync(tempPath, buffer);

        // 2. Execute Python Script using spawn (safer for paths with spaces)
        const projectRoot = path.resolve(__dirname, '../..');
        const pythonScript = path.resolve(projectRoot, 'src/ml/analyze.py');
        const venvPython = path.resolve(projectRoot, 'venv/bin/python3');

        // Determine Python Executable
        let pythonCmd = 'python3';
        if (fs.existsSync(venvPython)) {
            pythonCmd = venvPython;
        }

        console.log(`[ML-INFO] Python: "${pythonCmd}"`);
        console.log(`[ML-INFO] Script: "${pythonScript}"`);
        console.log(`[ML-INFO] Temp: "${tempPath}"`);

        // Check if script exists
        if (!fs.existsSync(pythonScript)) {
            throw new Error(`Python script not found at: ${pythonScript}`);
        }

        // Spawn process
        // 1. Fetch Grading Rules (GreenPercentage)
        const qualityParamRepo = AppDataSource.getRepository(QualityParameter);
        const gradingParams = await qualityParamRepo.find({
            where: { name: 'GreenPercentage', is_active: true },
            order: { min_value: 'ASC' }
        });

        // 2. Fetch Calibration Params (Calib_*)
        const calibParams = await qualityParamRepo.createQueryBuilder('qp')
            .where("qp.name LIKE :prefix", { prefix: 'Calib_%' })
            .getMany();

        // Helper to extract min/max from params
        const getCalibRange = (name: string, defaultMin: number, defaultMax: number) => {
            const p = calibParams.find(cp => cp.name === name);
            if (p) return [Number(p.min_value), Number(p.max_value)];
            return [defaultMin, defaultMax];
        };

        // Construct Payload
        const payload = {
            grading_rules: gradingParams.map(p => ({
                grade: p.grade,
                level: p.level,
                min_value: p.min_value,
                max_value: p.max_value
            })),
            calibration: {
                green: {
                    hue: getCalibRange('Calib_Green_Hue', 25, 95),
                    sat: getCalibRange('Calib_Green_Sat', 25, 255),
                    val: getCalibRange('Calib_Green_Val', 40, 255)
                },
                yellow: {
                    hue: getCalibRange('Calib_Yellow_Hue', 10, 25),
                    sat: getCalibRange('Calib_Yellow_Sat', 40, 255),
                    val: getCalibRange('Calib_Yellow_Val', 40, 255)
                }
            }
        };

        const configJson = JSON.stringify(payload);

        const { spawn } = require('child_process');

        // Pass configJson as second argument
        const pythonProcess = spawn(pythonCmd, [pythonScript, tempPath, configJson]);

        let stdoutData = '';
        let stderrData = '';

        await new Promise((resolve, reject) => {
            pythonProcess.stdout.on('data', (data: any) => {
                stdoutData += data.toString();
            });

            pythonProcess.stderr.on('data', (data: any) => {
                stderrData += data.toString();
            });

            pythonProcess.on('close', (code: number) => {
                if (code !== 0) {
                    console.error(`[ML-ERROR] Process exited with code ${code}`);
                    console.error(`[ML-ERROR] Stderr: ${stderrData}`);
                    reject(new Error(`ML Process exited with code ${code}: ${stderrData}`));
                } else {
                    resolve(true);
                }
            });

            pythonProcess.on('error', (err: any) => {
                reject(new Error(`Failed to start ML process: ${err.message}`));
            });
        });

        console.log('[ML-DEBUG] Output:', stdoutData);

        // Clean up temp file
        try {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        } catch (e) { console.error("[ML-DEBUG] Failed to delete temp file:", e); }

        // 3. Parse Result
        let result;
        try {
            const jsonMatch = stdoutData.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                // Check if stderr has info
                if (stderrData) throw new Error(`Script Error: ${stderrData}`);
                throw new Error("No JSON found in output");
            }
            result = JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error("[ML-ERROR] Parse failed:", e);
            throw new Error(`Invalid ML response: ${stdoutData}`);
        }

        if (result.error) {
            throw new Error(`ML Script Error: ${result.error}`);
        }


        if (result.error) {
            throw new Error(`ML Error: ${result.error}`);
        }

        console.log('ML Analysis Result:', result);

        // 4. Save to DB
        // Ensure values are numbers before saving
        const greenPct = typeof result.green_percentage === 'number' ? result.green_percentage : parseFloat(result.green_percentage || '0');

        const entity = await qcGabahRepository.create({
            supplier,
            lot,
            image_url: "local_script_processed",
            green_percentage: greenPct,
            grade: result.grade || 'Unknown',
            level: result.level || 1, // New field
            status: result.status || 'WARNING'
        });

        return entity;

    } catch (error: any) {
        console.error('[ML-ERROR] Analyze Grain Failed:', error);
        // Clean up temp file in case of error if it still exists
        try {
            // Re-construct temp path if needed, or assume loop variable availability issues
            // (Simpler: just leave it or rely on cron cleanup for tmp)
        } catch (e) { }

        throw new Error(error.message || "Internal Server Error during ML Analysis");
    }
}

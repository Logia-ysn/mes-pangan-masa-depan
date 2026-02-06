import { T_generateDummy } from "../types/api/T_generateDummy";
import { DummyService } from "../src/services/dummy.service";

export const t_generateDummy: T_generateDummy = async (req, res) => {
    try {
        const result = await DummyService.generateAll();
        return result;
    } catch (error) {
        console.error("Generate Dummy Error:", error);
        res.status(500);
        throw new Error((error as any).message);
    }
}

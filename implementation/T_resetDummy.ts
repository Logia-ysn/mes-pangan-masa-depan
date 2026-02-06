import { T_resetDummy } from "../types/api/T_resetDummy";
import { DummyService } from "../src/services/dummy.service";

export const t_resetDummy: T_resetDummy = async (req, res) => {
    try {
        const result = await DummyService.resetAll();
        return result;
    } catch (error) {
        console.error("Reset Dummy Error:", error);
        res.status(500);
        throw new Error((error as any).message);
    }
}

import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export const validate = (
  schema: z.ZodObject<any, any>,
  part: "body" | "params" = "body",
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req[part]);

      if (part === "params") {
        req.params = validatedData as Record<string, string>;
      } else {
        req.body = validatedData;
      }

      next();
    } catch (error: unknown) {

      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue: z.ZodIssue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errorMessages,
        });
      }
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };
};

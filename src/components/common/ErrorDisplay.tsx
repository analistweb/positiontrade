import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangleIcon } from "lucide-react";

interface ErrorDisplayProps {
  title?: string;
  message: string;
}

export const ErrorDisplay = ({ title = "Erro", message }: ErrorDisplayProps) => (
  <Alert variant="destructive">
    <AlertTriangleIcon className="h-4 w-4" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUpIcon } from "lucide-react";
import { motion } from "framer-motion";

export const RSICard = ({ children }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="border-b border-border/10">
      <CardTitle className="flex items-center gap-2 text-xl font-bold">
        <TrendingUpIcon className="h-6 w-6 text-primary" />
        Recomendação DCA
      </CardTitle>
    </CardHeader>
    <CardContent>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-4 py-4"
      >
        {children}
      </motion.div>
    </CardContent>
  </Card>
);
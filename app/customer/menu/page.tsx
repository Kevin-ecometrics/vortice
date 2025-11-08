import { Suspense } from "react";
import Menu from "../components/Menu";

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando Menu...</div>}>
      <Menu />
    </Suspense>
  );
}

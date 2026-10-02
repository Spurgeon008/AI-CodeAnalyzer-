import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div>
      <h1>Hello world</h1>
      <Button>Submit</Button>
      <ModeToggle />
    </div>
  );
}
``
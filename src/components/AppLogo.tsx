import Image from "next/image";

export function AppLogo({ className = "", ...props }: React.ComponentProps<"div">) {
    return (
        <div className={className} {...props}>
            <Image src="/logo.webp" alt="Logo de la aplicación" width={48} height={48} priority />
        </div>
    );
}

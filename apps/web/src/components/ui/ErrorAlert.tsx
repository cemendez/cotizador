export function ErrorAlert({ message, className = '' }: { message: string; className?: string }) {
    return (
        <p role="alert" className={`rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ${className}`}>
            {message}
        </p>
    )
}
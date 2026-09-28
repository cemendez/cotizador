import type { ComponentProps } from 'react'

type Props = ComponentProps<'textarea'> & { label: string; error?: string };

export function TextAreaField({ label, error, id, className = '', ...props }: Props) {
    const fieldId = id ?? props.name;
    return (
        <div className="space-y-1">
            <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">
                {label}
            </label>
            <textarea
                id={fieldId}
                rows={3}
                aria-invalid={Boolean(error)}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${error ? 'border-red-500' : 'border-slate-300'
                    } ${className}`}
                {...props}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    )
}
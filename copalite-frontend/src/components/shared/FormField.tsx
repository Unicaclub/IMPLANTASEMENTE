import clsx from 'clsx';

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}

export default function FormField({ label, error, children, required }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-coal-300">
        {label}
        {required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      <div className={clsx(error && '[&>input]:border-rose-500/60 [&>input]:focus:ring-rose-500/40 [&>select]:border-rose-500/60')}>
        {children}
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}

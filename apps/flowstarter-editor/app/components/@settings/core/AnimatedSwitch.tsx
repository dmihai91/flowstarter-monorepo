import { motion } from 'framer-motion';
import { Switch } from '@radix-ui/react-switch';
import { classNames } from '~/utils/classNames';

interface AnimatedSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id: string;
  label: string;
}

export const AnimatedSwitch = ({ checked, onCheckedChange, id, label }: AnimatedSwitchProps) => {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={classNames(
          'relative inline-flex h-6 w-11 items-center rounded-full',
          'transition-all duration-300 ease-[cubic-bezier(0.87,_0,_0.13,_1)]',
          'bg-flowstarter-elements-background-depth-3',
          'data-[state=checked]:bg-blue-500',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20',
          'cursor-pointer',
          'group',
        )}
      >
        <motion.span
          className={classNames(
            'absolute left-[2px] top-[2px]',
            'inline-block h-5 w-5 rounded-full',
            'bg-white shadow-lg',
            'transition-shadow duration-300',
            'group-hover:shadow-md group-active:shadow-sm',
            'group-hover:scale-95 group-active:scale-90',
          )}
          initial={false}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
            duration: 0.2,
          }}
          animate={{
            x: checked ? '1.25rem' : '0rem',
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-white"
            initial={false}
            animate={{
              scale: checked ? 1 : 0.8,
            }}
            transition={{ duration: 0.2 }}
          />
        </motion.span>
        <span className="sr-only">Toggle {label}</span>
      </Switch>
      <div className="flex items-center gap-2">
        <label
          htmlFor={id}
          className="text-sm text-gray-500 dark:text-gray-400 select-none cursor-pointer whitespace-nowrap w-[88px]"
        >
          {label}
        </label>
      </div>
    </div>
  );
};

export const BetaLabel = () => (
  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-blue-500/10 dark:bg-blue-500/20">
    <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">BETA</span>
  </div>
);

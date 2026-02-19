'use client';

import * as React from 'react';

interface MagicWandIconProps extends React.SVGProps<SVGSVGElement> {}

export function MagicWandIcon(props: MagicWandIconProps) {
  const { className, ...rest } = props;

  return (
    <svg
      width="19"
      height="20"
      viewBox="0 0 19 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <g clipPath="url(#clip0_342_750)">
        <path
          d="M0.65511 18.506C1.18708 19.0426 1.7892 19.3054 1.99967 19.0931L16.4486 4.51724C16.6594 4.30458 16.3989 3.69718 15.8669 3.16055C15.335 2.62393 14.7328 2.36111 14.5224 2.57377L0.0730789 17.1496C-0.137733 17.3619 0.123142 17.9693 0.65511 18.506ZM14.522 3.54567C14.6283 3.43849 14.9293 3.56972 15.1957 3.83804C15.462 4.10635 15.5914 4.41039 15.4855 4.51758L11.9334 8.10082L10.9702 7.12926L14.522 3.54567Z"
          fill="currentColor"
        />
        <path
          d="M19.8261 8.06101C17.5942 10.3714 17.5599 10.7463 19.3457 13.425C17.0618 11.1667 16.6919 11.1325 14.0435 12.939C16.2759 10.6286 16.3102 10.2543 14.5238 7.57495C16.8077 9.83329 17.1787 9.86747 19.8261 8.06101Z"
          fill="currentColor"
        />
        <path
          d="M9.08697 7.51103C6.01456 4.97831 5.55263 4.97831 2.47827 7.51103C4.98131 4.40121 4.98131 3.9338 2.47827 0.823975C5.55165 3.3567 6.01359 3.3567 9.08697 0.823975C6.58197 3.9338 6.58197 4.40121 9.08697 7.51103Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_342_750">
          <rect width="19" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export default MagicWandIcon;

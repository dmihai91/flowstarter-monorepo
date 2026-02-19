declare module 'react-password-strength-bar' {
  import * as React from 'react';

  export interface Props {
    password: string;
    minLength?: number;
    shortScoreWord?: string;
    scoreWords?: string[];
    barColors?: string[];
    className?: string;
  }

  export default class PasswordStrengthBar extends React.Component<Props> {}
}

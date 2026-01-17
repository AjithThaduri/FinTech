export interface Calculator {
    id: string;
    name: string;
    category: string;
    description: string;
    is_active: boolean;
    version?: string;
    created_at?: string;
}

export interface CalculatorDefinition {
    calculator_id: string;
    name: string;
    category: string;
    description: string;
    inputs: CalculatorInput[];
    steps: CalculatorStep[];
    outputs: string[];
    help_text?: string;
}

export interface CalculatorInput {
    key: string;
    label: string;
    type: 'number' | 'select' | 'text' | 'date' | 'boolean';
    required: boolean;
    min?: number;
    max?: number;
    options?: string[];
    default?: any;
    help_text?: string;
}

export interface CalculatorStep {
    id: string;
    expression?: string;
    rule_engine?: string;
    description?: string;
}

export interface CalculatorExecutionResult {
    success: boolean;
    outputs: Record<string, any>;
    steps: StepTrace[];
    execution_time_ms: number;
    error?: string;
}

export interface StepTrace {
    step_id: string;
    expression?: string;
    rule_engine?: string;
    description?: string;
    result: any;
    inputs_used: Record<string, any>;
}

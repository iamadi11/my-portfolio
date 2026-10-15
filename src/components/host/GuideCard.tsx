import React, { useState } from 'react';

import clsx from 'clsx';

import { Icon, ICON } from '@/components/host/icons';
import type { Listen } from '@/components/host/useGuideInput';

type Props = {
    firstName: string;
    caption: { who: 'host' | 'you'; text: string } | null;
    docked: boolean;
    touring: boolean;
    step: number;
    total: number;
    muted: boolean;
    question: string;
    prompts: string[];
    listen: Listen;
    onToggleTour: () => void;
    onNext: () => void;
    onMute: () => void;
    onQuestion: (text: string) => void;
    onAsk: (text: string) => void;
};

function tourLabel(touring: boolean, last: boolean): string {
    if (touring) return 'Pause tour';
    return last ? 'Replay tour' : 'Resume tour';
}

function AskPanel({ firstName, question, prompts, listen, onQuestion, onAsk }: Props): React.JSX.Element {
    return (
        <div id="host-ask" className="host-ask">
            <form
                className="host-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    onAsk(question);
                }}
            >
                <label className="ins-sr" htmlFor="host-q">
                    Ask {firstName} about work, experience, skills or contact
                </label>
                <input
                    id="host-q"
                    className="host-input"
                    value={question}
                    onChange={(event) => onQuestion(event.target.value)}
                    placeholder={listen.listening ? 'Listening…' : 'Ask about my work…'}
                    autoComplete="off"
                    autoFocus
                />
                {listen.canListen && (
                    <button
                        type="button"
                        className={clsx('ins-key host-icon', listen.listening && 'is-listening')}
                        onClick={listen.toggle}
                        aria-pressed={listen.listening}
                        aria-label="Ask with your voice"
                    >
                        <Icon d={ICON.mic} />
                    </button>
                )}
                <button
                    type="submit"
                    className="ins-key ins-key-primary host-icon"
                    aria-label="Send question"
                >
                    <Icon d={ICON.send} />
                </button>
            </form>
            <ul className="host-prompts" aria-label="Suggested questions">
                {prompts.map((prompt) => (
                    <li key={prompt}>
                        <button type="button" className="host-chip" onClick={() => onAsk(prompt)}>
                            {prompt}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** Captions (always on), tour controls, and the Ask panel. */
export default function GuideCard(props: Props): React.JSX.Element {
    const { firstName, caption, docked, touring, step, total, muted } = props;
    const [asking, setAsking] = useState(false);
    const last = step >= total - 1;

    return (
        <section className={clsx('host-card', docked && 'is-docked')} aria-label="Guide">
            <p className="host-caption" role="status" aria-live="polite">
                {caption && (
                    <>
                        <span className="host-who">{caption.who === 'you' ? 'You' : firstName}</span>
                        {caption.text}
                    </>
                )}
            </p>
            <div className="host-controls">
                <button
                    type="button"
                    className="ins-key host-icon"
                    onClick={props.onToggleTour}
                    aria-label={tourLabel(touring, last)}
                >
                    <Icon d={touring ? ICON.pause : ICON.play} />
                </button>
                <button
                    type="button"
                    className="ins-key host-icon"
                    onClick={props.onNext}
                    aria-label="Next stop"
                    disabled={last}
                >
                    <Icon d={ICON.next} />
                </button>
                <button
                    type="button"
                    className="ins-key host-icon"
                    onClick={props.onMute}
                    aria-pressed={muted}
                    aria-label="Mute voice"
                >
                    <Icon d={muted ? ICON.muted : ICON.sound} />
                </button>
                <span className="host-step" aria-hidden="true">
                    {Math.max(0, Math.min(step + 1, total))}/{total}
                </span>
                <button
                    type="button"
                    className={clsx('ins-key host-ask-key', asking && 'is-on')}
                    onClick={() => setAsking((a) => !a)}
                    aria-expanded={asking}
                    aria-controls="host-ask"
                >
                    Ask
                </button>
            </div>
            {asking && <AskPanel {...props} />}
        </section>
    );
}

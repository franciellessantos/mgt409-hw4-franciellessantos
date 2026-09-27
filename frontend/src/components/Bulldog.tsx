/** Handsome-Dan-inspired bulldog face, built from plain HTML + CSS. */
export default function Bulldog({ size = 56 }: { size?: number }) {
  return (
    <span className="bulldog" style={{ ['--bd-size' as string]: `${size}px` }} aria-hidden="true">
      <span className="bd-ear bd-ear-left" />
      <span className="bd-ear bd-ear-right" />
      <span className="bd-head">
        <span className="bd-brow" />
        <span className="bd-eye bd-eye-left" />
        <span className="bd-eye bd-eye-right" />
        <span className="bd-muzzle">
          <span className="bd-nose" />
          <span className="bd-jowl bd-jowl-left" />
          <span className="bd-jowl bd-jowl-right" />
          <span className="bd-tooth bd-tooth-left" />
          <span className="bd-tooth bd-tooth-right" />
        </span>
      </span>
      <span className="bd-collar"><span className="bd-tag">Y</span></span>
    </span>
  )
}

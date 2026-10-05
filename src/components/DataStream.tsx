/** Bandeau de faux enregistrements floutés qui défilent (décoratif). */

const RECORDS = [
  ['email', 'j.dupont@mail.test'],
  ['password', 'e10adc3949ba59abbe56'],
  ['phone', '+33 6 12 34 56 78'],
  ['iban', 'FR76 3000 6000 0112'],
  ['birthdate', '1991-04-17'],
  ['address', '8 rue des Lilas, Lyon'],
  ['ip', '192.0.2.44'],
  ['username', 'camille_m'],
];

export function DataStream() {
  const items = [...RECORDS, ...RECORDS];
  return (
    <div className="stream" aria-hidden="true">
      <div className="stream__track">
        {items.map(([key, value], i) => (
          <span className="stream__item" key={i}>
            <b>{key}</b>
            <s>{value}</s>
          </span>
        ))}
      </div>
    </div>
  );
}

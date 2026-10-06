/** Bandeau d'enregistrements floutés qui défilent (décoratif) : formats réalistes, valeurs masquées, personne fictive. */

const RECORDS = [
  ['email', 'j.dup•••@orange.fr'],
  ['password', 'e10adc3949ba59abbe56'],
  ['phone', '+33 6 •• •• 56 78'],
  ['iban', 'FR76 3000 4••• ••••'],
  ['birthdate', '1991-••-17'],
  ['address', '•• rue de la République, Lyon'],
  ['ip', '90.1••.•••.44'],
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

import { LEVEL_CARD_STYLES } from './maintenanceHelpers'

export default function LevelCard({ opt, isSelected, onClick }) {
  const style = LEVEL_CARD_STYLES[opt.color] || LEVEL_CARD_STYLES.success

  return (
    <div className="col-span-12 md:col-span-4">
      <div
        className={[
          'bg-card rounded-card border transition-all duration-200',
          isSelected
            ? style.selected
            : 'border-surface-200 dark:border-surface-300 shadow-card dark:shadow-card-dark hover:shadow-md cursor-pointer',
        ].join(' ')}
        onClick={!isSelected ? onClick : undefined}
      >
        <div className="py-5 text-center">
          <i className={`bx ${opt.icon} ${style.icon} mb-2 text-3xl`} />
          <h6 className={`mb-1 text-surface-800 ${isSelected ? style.heading : ''}`}>
            {opt.label}
            {isSelected ? <i className="bx bx-check ml-1" /> : null}
          </h6>
          <small className="text-surface-500 text-xs">{opt.description}</small>
        </div>
      </div>
    </div>
  )
}

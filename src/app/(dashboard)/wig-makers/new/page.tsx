import { WigMakerForm } from '../_components/wig-maker-form'

export default function NewWigMakerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Add Wig Maker</h2>
        <p className="text-muted-foreground">
          Add a new wig maker to your team
        </p>
      </div>

      <WigMakerForm />
    </div>
  )
}

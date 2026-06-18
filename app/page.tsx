import { BlogPosts } from 'app/components/posts'

export default function Page() {
  return (
    <section>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-xl font-semibold text-white shadow-lg">
          SK
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tighter bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Sam K.
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Software Engineer · Builder · Lifelong learner
          </p>
        </div>
      </div>

      <p className="mb-4 leading-relaxed">
        {`I build clean, fast software and sweat the small details that make
        things feel effortless. I'm a Vim enthusiast and tab advocate who
        believes static typing pays for itself in fewer late-night bugs — and
        yes, always dark mode.`}
      </p>

      <div className="mb-8 flex flex-wrap gap-2">
        {['TypeScript', 'React', 'Next.js', 'Vim', 'Dark mode'].map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 dark:border-neutral-800 dark:text-neutral-400"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="my-8">
        <BlogPosts />
      </div>
    </section>
  )
}

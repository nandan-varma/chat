'use client'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"

const FormSchema = z.object({
  UserName: z.string(),
  RoomID: z.string(),
})

export default function Component() {
  const router = useRouter();
  // const biscuits = cookies()
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    // defaultValues: {
    //   UserName: "NV",
    //   RoomID: "1",
    // },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    // biscuits.set('username',form.getValues().UserName);
    router.push(`/room/${form.getValues().RoomID}`);
  }

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              Welcome to Chats
              <span className="text-lg tracking-normal font-normal border-b">
                ALPHA
              </span>
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Encryption coming soon
            </p>
          </div>
          <Link href={'/room/0ee5464c-db0d-4993-bdec-8aa34177e0cb'}>
            <Button className="w-24 m-4" type="submit">
              Learn more
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
